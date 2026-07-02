/**
 * Lint script to check for hardcoded hex colors in source files.
 * Fails CI if hex colors are found outside of globals.css.
 * 
 * Exceptions:
 * - src/app/globals.css (design tokens file)
 * - Google logo colors in login/register pages (#4285F4, #34A853, #FBBC05, #EA4335)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_FILES = [
    'globals.css',      // Design tokens file
    'QuotePDF.tsx',     // Native inline react-pdf styling requires hex
    'global-error.tsx', // Low-level fallback error boundary requires static styles
];

// Google brand colors that are allowed
const ALLOWED_COLORS = [
    '#4285F4',  // Google blue
    '#34A853',  // Google green
    '#FBBC05',  // Google yellow
    '#EA4335',  // Google red
];

const HEX_PATTERN = /#[0-9A-Fa-f]{3,8}/g;

function findHexColorsInFile(filePath: string): { line: number; color: string; content: string }[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: { line: number; color: string; content: string }[] = [];

    lines.forEach((lineContent, index) => {
        const matches = lineContent.match(HEX_PATTERN);
        if (matches) {
            matches.forEach((color) => {
                // Skip allowed colors (Google brand)
                if (!ALLOWED_COLORS.includes(color.toUpperCase())) {
                    violations.push({
                        line: index + 1,
                        color,
                        content: lineContent.trim().substring(0, 80),
                    });
                }
            });
        }
    });

    return violations;
}

function main() {
    const srcDir = path.join(process.cwd(), 'src');

    console.log('🔍 Checking for hardcoded hex colors...\n');

    let totalViolations = 0;
    const fileViolations: { file: string; violations: { line: number; color: string; content: string }[] }[] = [];

    // Find all .tsx, .ts, .css files in src
    function walkDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else if (/\.(tsx?|css)$/.test(file)) {
                // Skip allowed files
                if (ALLOWED_FILES.some(allowed => fullPath.includes(allowed))) {
                    continue;
                }

                const violations = findHexColorsInFile(fullPath);
                if (violations.length > 0) {
                    fileViolations.push({
                        file: path.relative(process.cwd(), fullPath),
                        violations
                    });
                    totalViolations += violations.length;
                }
            }
        }
    }

    walkDir(srcDir);

    if (totalViolations === 0) {
        console.log('✅ No hardcoded hex colors found!\n');
        console.log('All color values are using design system tokens from globals.css.');
        process.exit(0);
    } else {
        console.log(`❌ Found ${totalViolations} hardcoded hex color(s):\n`);

        for (const { file, violations } of fileViolations) {
            console.log(`📄 ${file}`);
            for (const { line, color, content } of violations) {
                console.log(`   Line ${line}: ${color}`);
                console.log(`   → ${content}\n`);
            }
        }

        console.log('\n💡 How to fix:');
        console.log('   Replace hardcoded colors with design system tokens:');
        console.log('   - #073674 → text-primary / bg-primary');
        console.log('   - #172436 → text-foreground / bg-foreground');
        console.log('   - #F4F7FA → bg-background');
        console.log('   - #DEE4ED → border-border / bg-muted');
        console.log('\n   See src/app/globals.css for all available tokens.');

        process.exit(1);
    }
}

main();
