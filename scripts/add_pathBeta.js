const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data.json');
const backupPath = dataPath + '.bak-pathBeta';

if (!fs.existsSync(dataPath)) {
  console.error('data.json not found at', dataPath);
  process.exit(1);
}

const raw = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(raw);

fs.copyFileSync(dataPath, backupPath);
console.log('Backup written to', backupPath);

let updated = 0;
data.sites = data.sites.map(site => {
  const p = site.path || site.url || '';
  const pBeta = p.replace(/douyou_release/g, 'doyou_beta');
  if (pBeta !== p) {
    site.pathBeta = pBeta;
    updated++;
  } else {
    // still add pathBeta even if unchanged to keep consistent
    site.pathBeta = p;
  }
  return site;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated data.json - pathBeta added for', updated, 'sites (others copied).');
