const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if it uses <DialogFooter
            if (content.includes('<DialogFooter')) {
                // Check if it's imported
                const importRegex = /import\s+{([^}]*)}\s+from\s+['"]@\/components\/ui\/dialog['"]/;
                const match = content.match(importRegex);
                
                if (match) {
                    const imports = match[1];
                    if (!imports.includes('DialogFooter')) {
                        // Add DialogFooter
                        const newImports = imports + ', DialogFooter';
                        content = content.replace(importRegex, `import {${newImports}} from '@/components/ui/dialog'`);
                        fs.writeFileSync(fullPath, content);
                        console.log(`Updated ${fullPath}`);
                    }
                } else {
                    console.log(`WARNING: Used DialogFooter but no dialog import found in ${fullPath}`);
                }
            }
        }
    }
}

processDir('src/components');
processDir('src/pages');
