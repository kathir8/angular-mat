#!/usr/bin/env node
const glob = require('glob');
const fs = require('fs');
const path = require('path');

const folderName = '';

const pattern = `src/app/${folderName}/**/*.html`;
const files = glob.sync(pattern);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // First split the content into commented and non-commented sections
    const sections = [];
    let lastIndex = 0;
    let commentStart, commentEnd;

    while ((commentStart = content.indexOf('<!--', lastIndex)) !== -1) {
        // Add non-commented section before this comment
        if (commentStart > lastIndex) {
            sections.push({
                type: 'code',
                content: content.substring(lastIndex, commentStart)
            });
        }

        // Find the end of this comment
        commentEnd = content.indexOf('-->', commentStart);
        if (commentEnd === -1) {
            commentEnd = content.length;
        } else {
            commentEnd += 3; // include the '-->'
        }

        // Add the commented section
        sections.push({
            type: 'comment',
            content: content.substring(commentStart, commentEnd)
        });

        lastIndex = commentEnd;
    }

    // Add remaining non-commented content
    if (lastIndex < content.length) {
        sections.push({
            type: 'code',
            content: content.substring(lastIndex)
        });
    }

    // Process only non-commented sections
    let newContent = sections.map(section => {
        if (section.type === 'comment') {
            return section.content; // leave comments unchanged
        }

        return section.content.replace(
            /(<mat-form-field\b[^>]*>)([\s\S]*?)(<\/mat-form-field>)/gm,
            (_, openingTag, innerContent, closingTag) => {
                let updatedInner = innerContent;
                if (!innerContent.includes("<mat-label")) {
                    updatedInner = innerContent.replace(
                        /(^\s*)<(input|mat-select|textarea)\b([^>]*?)\s(?:placeholder\s*=\s*(['"])(.*?)\4|\[placeholder\]\s*=\s*(['"])(.*?)\6)([^>]*?)>/gm,
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
    }).join('');

    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`✔ Updated: ${path.relative(process.cwd(), file)}`);
    }
});