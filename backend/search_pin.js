const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      search(fullPath);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('pin') || content.includes('PIN')) {
        console.log('Match in file:', fullPath);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('pin') || line.includes('PIN')) {
            console.log(`  L${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

search('c:\\Users\\Admin\\Desktop\\Projects\\Doings\\AB Data Hub\\backend\\src');
