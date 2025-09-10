const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');

function backup(originalPath) {
  const ts = Date.now();
  const bakPath = originalPath + `.bak.${ts}`;
  fs.copyFileSync(originalPath, bakPath);
  return bakPath;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('data.json not found at', DATA_PATH);
    process.exit(1);
  }

  const bak = backup(DATA_PATH);
  console.log('Backup written to', bak);

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(2);
  }

  if (!Array.isArray(data.sites)) {
    console.error('data.sites is not an array');
    process.exit(3);
  }

  let changed = 0;
  data.sites = data.sites.map(site => {
    if (site && site.pubid === '') {
      if (site.categoryId !== 3) {
        site.categoryId = 3;
        changed++;
      }
    }
    return site;
  });

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${changed} site(s).`);
}

main();
