import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// Regex para detectar clases de color de tailwind con slate, gray, zinc, neutral, stone, incluyendo modificador de opacidad (ej: /50, /80)
const COLOR_REGEX = /(?:[a-z0-9:-]+-)?(?:slate|gray|zinc|neutral|stone)-[0-9]+(?:\/[0-9]+)?/g;

function walkDir(dir: string, fileCallback: (filePath: string) => void) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file === 'design-review-package' || file === 'node_modules' || file === '.next') {
                continue;
            }
            walkDir(fullPath, fileCallback);
        } else if (/\.(tsx?|css)$/.test(file)) {
            fileCallback(fullPath);
        }
    }
}

function mapClassToToken(fullClass: string, lineContent: string, filePath: string): string {
    const match = fullClass.match(/^((?:[a-z0-9-]+:)*)(text|bg|border|ring|divide|from|to|via|placeholder:text|fill|stroke)-(?:slate|gray|zinc|neutral|stone)-([0-9]+)(\/[0-9]+)?$/);
    
    if (!match) {
        return fullClass;
    }

    const [_, prefix, utility, shadeStr, opacityStr = ''] = match;
    const shade = parseInt(shadeStr, 10);

    if (utility === 'placeholder:text' || (utility === 'text' && prefix.endsWith('placeholder:'))) {
        const cleanPrefix = prefix.replace(/placeholder:$/, '');
        return `${cleanPrefix}placeholder:text-muted-foreground${opacityStr}`;
    }

    if (utility === 'text') {
        if (shade >= 700) {
            return `${prefix}text-foreground${opacityStr}`;
        }
        if (shade >= 400 && shade < 700) {
            return `${prefix}text-muted-foreground${opacityStr}`;
        }
        // Sombras claras 100, 200, 300
        if (prefix.includes('dark:')) {
            return `${prefix}text-foreground${opacityStr}`;
        }
        if (filePath.endsWith('TrendChart.tsx') || lineContent.includes('bg-slate-950') || lineContent.includes('bg-slate-900') || lineContent.includes('bg-slate-800') || lineContent.includes('bg-foreground')) {
            return `${prefix}text-primary-foreground${opacityStr}`;
        }
        return `${prefix}text-muted-foreground${opacityStr}`;
    }

    if (utility === 'bg') {
        if (prefix.includes('hover:') || prefix.includes('active:') || prefix.includes('focus:')) {
            return `${prefix}bg-accent${opacityStr}`;
        }
        if (shade === 50 || shade === 100) {
            // Regla de usuario: bg-muted si es chip/tabla; bg-secondary si es fondo de sección
            const isSection = lineContent.includes('<section') || 
                              lineContent.includes('<main') || 
                              lineContent.includes('min-h-screen') || 
                              lineContent.includes('py-12') || 
                              lineContent.includes('py-16') || 
                              lineContent.includes('py-20') || 
                              lineContent.includes('py-24');
            return isSection ? `${prefix}bg-secondary${opacityStr}` : `${prefix}bg-muted${opacityStr}`;
        }
        if (shade >= 150 && shade <= 400) {
            return `${prefix}bg-muted${opacityStr}`;
        }
        if (shade >= 500 && shade <= 700) {
            return `${prefix}bg-secondary${opacityStr}`;
        }
        // 800, 900, 950
        if (prefix.includes('dark:')) {
            return shade === 100 || shade === 200 ? `${prefix}bg-secondary${opacityStr}` : `${prefix}bg-card${opacityStr}`;
        }
        if (lineContent.includes('pointer-events-none') || lineContent.includes('tooltip')) {
            return `${prefix}bg-foreground${opacityStr}`;
        }
        if (shade === 900) {
            return `${prefix}bg-primary${opacityStr}`;
        }
        return `${prefix}bg-card${opacityStr}`;
    }

    if (utility === 'border') {
        return `${prefix}border-border${opacityStr}`;
    }

    if (utility === 'divide') {
        return `${prefix}divide-border${opacityStr}`;
    }

    if (utility === 'ring') {
        return `${prefix}ring-border${opacityStr}`;
    }

    if (utility === 'from') {
        return `${prefix}from-primary${opacityStr}`;
    }

    if (utility === 'to' || utility === 'via') {
        return `${prefix}${utility}-primary/80`;
    }

    return fullClass;
}

const isTest = process.argv.includes('--test');
const isMigrate = process.argv.includes('--migrate');

if (isTest || isMigrate) {
    let totalFilesModified = 0;
    let totalReplacements = 0;

    walkDir(srcDir, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        let modified = false;
        const isPageTsx = filePath.endsWith('page.tsx') && filePath.includes('app');
        let inBrand3Section = false;

        const newLines = lines.map((line, _idx) => {
            if (isPageTsx) {
                if (line.includes('<section') && line.includes('bg-brand-3')) {
                    inBrand3Section = true;
                }
                if (line.includes('</section>') && inBrand3Section) {
                    inBrand3Section = false;
                }
                if (inBrand3Section) {
                    if (line.match(COLOR_REGEX) && !line.includes('design-token-exempt')) {
                        modified = true;
                        return line.replace('>', ' /* design-token-exempt */>');
                    }
                    return line;
                }
            }

            let newLine = line;
            const matches = line.match(COLOR_REGEX);
            if (matches) {
                if (line.includes('design-token-exempt')) {
                    return line;
                }

                matches.forEach((cls) => {
                    const token = mapClassToToken(cls, line, filePath);
                    if (token !== cls) {
                        const escapeCls = cls.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const replaceRegex = new RegExp(`(?<=^|["'\`\\s:])${escapeCls}(?=["'\`\\s]|$)`, 'g');
                        if (replaceRegex.test(newLine)) {
                            newLine = newLine.replace(replaceRegex, token);
                            totalReplacements++;
                            modified = true;
                        }
                    }
                });
            }
            return newLine;
        });

        if (modified) {
            totalFilesModified++;
            if (isMigrate) {
                fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
            }
        }
    });

    if (isTest) {
        console.log(`🧪 [TEST] Se modificarían ${totalFilesModified} archivos con ${totalReplacements} reemplazos.`);
    } else if (isMigrate) {
        console.log(`✅ [MIGRACIÓN COMPLETADA] Se actualizaron ${totalFilesModified} archivos con ${totalReplacements} reemplazos.`);
    }
} else {
    console.log('Por favor especifica --test o --migrate.');
}