const fs = require("fs-extra");
const cheerio = require("cheerio");
const glob = require("glob");

const files = glob.sync("./src/**/*.html");

files.forEach(file => {
  const html = fs.readFileSync(file, "utf-8");
  const $ = cheerio.load(html, { xmlMode: false });

  let changed = false;

  $("mat-form-field").each((_, el) => {
    const field = $(el);

    // Skip commented mat-form-field
    const fieldHtml = $.html(field);
    if (fieldHtml.includes("<!--") && fieldHtml.includes("-->")) return;

    const input = field.find("input[matInput], input[matinput]");
    const select = field.find("mat-select");

    // Handle input[matInput]
    if (input.length) {
      let placeholderAttr =
        input.attr("placeholder") ||
        input.attr("[placeholder]");

      let placeholderValue =
        placeholderAttr?.replace(/['"\[\]]+/g, "").split("|")[0].trim();

      if (placeholderValue && !field.find("mat-label").length) {
        input.removeAttr("placeholder");
        input.removeAttr("[placeholder]");
        field.prepend(`\n<mat-label>{{ '${placeholderValue}' | translate }}</mat-label>`);
        changed = true;
      }
    }

    // Handle mat-select
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

    const camelAttributes = [
      "matInput",
      "formControl",
      "formGroup",
      "formArrayName",
      "formGroupName",
      "ngModel",
      "ngIf",
      "ngFor",
      "ngClass",
      "ngStyle",
      "ngSwitch",
      "ngSwitchCase",
      "ngSwitchDefault",
      "disableRipple",
      "disableOptionCentering",
      "autofocus",
      "multiple",
      "readonly",
      "required",
      "novalidate"
    ];

    camelAttributes.forEach(attr => {
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\b${attr.toLowerCase()}=""`, "g"),
        attr
      );
      updatedHtml = updatedHtml.replace(
        new RegExp(`\\*${attr.toLowerCase()}=`, "g"),
        `*${attr}=`
      );
    });

    fs.writeFileSync(file, updatedHtml);
    console.log("✅ Updated:", file);
  }
});
