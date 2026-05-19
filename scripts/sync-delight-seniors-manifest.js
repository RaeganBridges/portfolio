const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'delight-seniors-images');
const files = fs.readdirSync(dir)
  .filter((f) => /^D_\d+\.png$/i.test(f))
  .sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);

fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(files, null, 2) + '\n');
console.log('Updated manifest.json with', files.length, 'images');
