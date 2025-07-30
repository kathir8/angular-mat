const fs = require("fs-extra");
const cheerio = require("cheerio");
const glob = require("glob");

const files = glob.sync("./src/**/*.html");

const camelAttributes = [
  "matInput", "formControl", "formGroup", "formArrayName", "formGroupName",
  "ngModel", "ngIf", "ngFor", "ngClass", "ngStyle", "ngSwitch", "ngSwitchCase",
  "ngSwitchDefault", "disableRipple", "disableOptionCentering", "autofocus",
  "multiple", "readonly", "required", "novalidate", "selectedIndex"
];

files.forEach(file => {
  const html = fs.readFileSync(file, "utf-8");
  const $ = cheerio.load(html, { xmlMode: false });

  let changed = false;

  $("mat-form-field").each((_, el) => {
    const field = $(el);
    const fieldHtml = $.html(field);
    if (fieldHtml.includes("<!--") && fieldHtml.includes("-->")) return;

    const input = field.find("input[matInput], input[matinput]");
    const select = field.find("mat-select");

    if (input.length) {
      let placeholderAttr =
        input.attr("placeholder") || input.attr("[placeholder]");
      let placeholderValue =
        placeholderAttr?.replace(/['"\[\]]+/g, "").split("|")[0].trim();

      if (placeholderValue && !field.find("mat-label").length) {
        input.removeAttr("placeholder");
        input.removeAttr("[placeholder]");
        field.prepend(`\n<mat-label>{{ '${placeholderValue}' | translate }}</mat-label>`);
        changed = true;
      }
    }

    if (select.length && !field.find("mat-label").length) {
      const selectHtml = $.html(select);
      if (selectHtml.includes("<!--") && selectHtml.includes("-->")) return;

      const placeholder = select.attr("placeholder");
      const placeholderValue = placeholder?.replace(/['"\[\]]+/g, "").split("|")[0].trim();

      if (placeholderValue) {
        select.removeAttr("placeholder");
        field.prepend(`\n<mat-label>{{ '${placeholderValue}' | translate }}</mat-label>`);
        changed = true;
      }
    }
  });

  if (changed) {
    let updatedHtml = $("body").html();

    // Fix standard angular directive casing
    camelAttributes.forEach(attr => {
      const lower = attr.toLowerCase();
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\*${lower}=`, "g"),
        `*${attr}=`
      );
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\[${lower}\\]`, "g"),
        `[${attr}]`
      );
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\[\\(${lower}\\)\\]`, "g"),
        `[(${attr})]`
      );
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\(${lower}change\\)`, "g"),
        `(${attr}Change)`
      );
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\b${lower}=""`, "g"),
        `${attr}`
      );
    });

    // Dynamically correct other camelCase attributes used in original file
    const originalBindings = [...html.matchAll(/[\[\(\[]+([a-zA-Z0-9]+)[\]\)]+/g)].map(m => m[1]);
    const originalCamelCase = originalBindings.filter(name => /[A-Z]/.test(name));

    originalCamelCase.forEach(attr => {
      const lower = attr.toLowerCase();
      if (!camelAttributes.includes(attr)) {
        // Fix property: [attr]
        updatedHtml = updatedHtml.replace(
          new RegExp(`\\[${lower}\\]`, "g"),
          `[${attr}]`
        );
        // Fix event: (attr)
        updatedHtml = updatedHtml.replace(
          new RegExp(`\\(${lower}\\)`, "g"),
          `(${attr})`
        );
        // Fix two-way: [(attr)]
        updatedHtml = updatedHtml.replace(
          new RegExp(`\\[\\(${lower}\\)\\]`, "g"),
          `[(${attr})]`
        );
      }
    });

    fs.writeFileSync(file, updatedHtml);
    console.log("✅ Updated:", file);
  }
});
