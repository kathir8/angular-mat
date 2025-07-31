#!/usr/bin/env node
const  glob  = require('glob');      // ← destructure glob from the moduleconst fs   = require('fs');
const path = require('path');
const fs  = require('fs');
// Adjust this to match where your .html files live
const files = glob.sync("./src/**/*.html");

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  let newContent = content.replace(
    // Capture the full mat-form-field block in three groups
     /(?<!<!--\s*)(<mat-form-field\b[^>]*>)([\s\S]*?)(<\/mat-form-field>)/gm,
    (_, openingTag, innerContent, closingTag) => {
        let updatedInner = innerContent;
       if(!innerContent.includes("<mat-label")){
           // Within the block, replace any <input … placeholder="…"> 
           updatedInner = innerContent.replace(
             // Capture indentation, pre-attributes, quote type, placeholder value, post-attributes
             /(^\s*)<input\b([^>]*?)\splaceholder\s*=\s*(['"])(.*?)\3([^>]*?)>/gm,
             (_, indent, preAttrs, _q, placeholderValue, postAttrs) => {
               // Build label + cleaned input
               const ph = placeholderValue.trim();
               const isTranslateAvailable = ph.includes('|');
               const labelLine = isTranslateAvailable ? `${indent}<mat-label>{{${ph}}}</mat-label>` : `${indent}<mat-label>${ph}</mat-label>`;
               const inputLine = `${indent}<input${preAttrs}${postAttrs}>`;
               return `${labelLine}\n${inputLine}`;
             }
           );
       }

      return `${openingTag}${updatedInner}${closingTag}`;
    }
  );
 

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✔ Updated: ${path.relative(process.cwd(), file)}`);
  }
});
