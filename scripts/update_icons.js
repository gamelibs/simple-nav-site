const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'src', 'data.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(data.sites)) {
  console.error('No sites array');
  process.exit(1);
}
let updated = 0;
data.sites = data.sites.map(site => {
  const gid = (site.gid || '').toString();
  const gidSafe = gid.replace(/[^a-zA-Z0-9\-]/g, '');
  const url = `https://cpsense.heiheigame.com/gameicon/${gidSafe}-icon-128.jpg`;
  if (site.icon !== url) {
    site.icon = url;
    updated++;
  }
  return site;
});
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Updated icons for', updated, 'sites');
