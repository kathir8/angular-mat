#!/usr/bin/env node
const glob = require('glob');      // ← destructure glob from the moduleconst fs   = require('fs');
const path = require('path');
const fs = require('fs');
// Adjust this to match where your .html files live
const files = glob.sync("./src/**/*.html");

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    let newContent = content.replace(
        // Capture the full mat-form-field block in three groups
        /(?<!<!--\s*)(<mat-form-field\b[^>]*>)([\s\S]*?)(<\/mat-form-field>)/gm,
        (_, openingTag, innerContent, closingTag) => {
            let updatedInner = innerContent;
            if (!innerContent.includes("<mat-label")) { // Already mat-label present
                // Within the block, replace any <input … placeholder="…"> 
                updatedInner = innerContent.replace(
                    /(^\s*)<(input|mat-select)\b([^>]*?)\s(?:placeholder\s*=\s*(['"])(.*?)\4|\[placeholder\]\s*=\s*(['"])(.*?)\6)([^>]*?)>/gm,
                    (_, indent, tagName, preAttrs, q1, placeholderValue1, q2, placeholderValue2, postAttrs) => {
                        // Get the placeholder value
                        let placeholderValue = (placeholderValue1 || placeholderValue2).trim();

                        // Clean attributes - remove both quoted and unquoted placeholders
                        let cleanPreAttrs = preAttrs
                            .replace(/\s*placeholder\s*=\s*(['"]?)[^'"\s>]*\1/g, '')
                            .replace(/\s*\[placeholder\]\s*=\s*['"][^'"]*['"]/g, '')
                            .trim();

                        // Clean post attributes
                        let cleanPostAttrs = postAttrs.trim();

                        // Build the mat-label
                        let labelLine;
                        if (placeholderValue.includes('|')) {
                            // Translation case
                            labelLine = `${indent}<mat-label>{{${placeholderValue}}}</mat-label>`;
                        } else {
                            // Simple text case - ensure we don't have any remaining quotes
                            placeholderValue = placeholderValue.replace(/^['"]|['"]$/g, '');
                            labelLine = `${indent}<mat-label>${placeholderValue}</mat-label>`;
                        }

                        // Build the cleaned element
                        const elementAttrs = [cleanPreAttrs, cleanPostAttrs]
                            .filter(attr => attr.length > 0)
                            .join(' ');
                        const elementLine = `${indent}<${tagName}${elementAttrs ? ' ' + elementAttrs : ''}>`;

                        return `${labelLine}\n${elementLine}`;
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
