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
      if (content.includes("@Controller('users')") || content.includes('@Controller("users")')) {
        console.log('Found UsersController in:', fullPath);
      }
    }
  }
}

search('c:\\Users\\Admin\\Desktop\\Projects\\Doings\\AB Data Hub\\backend\\src');
