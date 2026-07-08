/**
 * Lint script to check for hardcoded hex colors and Tailwind default gray/slate colors in source files.
 * Fails CI if hex colors or default gray palettes are found outside of globals.css.
 * 
 * Exceptions:
 * - src/app/globals.css (design tokens file)
 * - Google logo colors in login/register pages (#4285F4, #34A853, #FBBC05, #EA4335)
 * - Lines with comment: // design-token-exempt
 */


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

// Patrón para detectar paletas grises nativas de Tailwind (slate, gray, zinc, neutral, stone)
// Exige que justo antes del prefijo haya comilla, backtick, espacio, o inicio de línea (nunca una letra para evitar falsos positivos con translate-, isolate-, etc.)
const TAILWIND_COLOR_PATTERN = /(?<=^|["'`\s])(?:(?:[a-z0-9-]+:)*)(?:text|bg|border|ring|divide|from|to|via|placeholder|fill|stroke)-(?:slate|gray|zinc|neutral|stone)-[0-9]+/g;

function findColorViolationsInFile(filePath: string): { line: number; color: string; content: string }[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: { line: number; color: string; content: string }[] = [];

    lines.forEach((lineContent, index) => {
        // Exención por línea con comentario // design-token-exempt
        if (lineContent.includes('// design-token-exempt') || lineContent.includes('design-token-exempt')) {
            return;
        }

        // 1. Check HEX colors
        const hexMatches = lineContent.match(HEX_PATTERN);
        if (hexMatches) {
            hexMatches.forEach((color) => {
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

        // 2. Check Slate/Gray/Zinc/Neutral/Stone colors
        const tailwindMatches = lineContent.match(TAILWIND_COLOR_PATTERN);
        if (tailwindMatches) {
            tailwindMatches.forEach((color) => {
                violations.push({
                    line: index + 1,
                    color,
                    content: lineContent.trim().substring(0, 80),
                });
            });
        }
    });

    return violations;
}

function main() {
    const srcDir = path.join(process.cwd(), 'src');

    console.log('🔍 Checking for hardcoded hex and Tailwind default gray/slate colors...\n');

    let totalViolations = 0;
    const fileViolations: { file: string; violations: { line: number; color: string; content: string }[] }[] = [];

    // Find all .tsx, .ts, .css files in src
    function walkDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (file === 'design-review-package' || file === 'node_modules' || file === '.next') {
                    continue;
                }
                walkDir(fullPath);
            } else if (/\.(tsx?|css)$/.test(file)) {
                // Skip allowed files
                if (ALLOWED_FILES.some(allowed => fullPath.includes(allowed))) {
                    continue;
                }

                const violations = findColorViolationsInFile(fullPath);
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
        console.log('✅ No hardcoded hex or Tailwind default gray/slate colors found!\n');
        console.log('All color values are using design system tokens from globals.css.');
        process.exit(0);
    } else {
        console.log(`❌ Found ${totalViolations} color violation(s):\n`);

        for (const { file, violations } of fileViolations) {
            console.log(`📄 ${file}`);
            for (const { line, color, content } of violations) {
                console.log(`   Line ${line}: ${color}`);
                console.log(`   → ${content}\n`);
            }
        }

        console.log('\n💡 How to fix:');
        console.log('   Replace hardcoded hex colors and slate/gray/zinc/neutral/stone classes with design system tokens:');
        console.log('   - #073674 → text-primary / bg-primary');
        console.log('   - #172436 → text-foreground / bg-foreground');
        console.log('   - text-slate-900 / text-gray-800 → text-foreground');
        console.log('   - text-slate-500 / text-gray-400 → text-muted-foreground');
        console.log('   - bg-slate-50 / bg-gray-100 → bg-secondary / bg-muted');
        console.log('   - border-slate-200 / border-gray-300 → border-border');
        console.log('\n   See src/app/globals.css for all available tokens.');

        process.exit(1);
    }
}

main();
