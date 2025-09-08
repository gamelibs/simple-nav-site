const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'src', 'data.json');
const bak = file + '.pre-normalize.bak';
fs.copyFileSync(file, bak);
console.log('Backup saved to', bak);
const data = JSON.parse(fs.readFileSync(file,'utf8'));
if (!Array.isArray(data.sites)) { console.error('no sites'); process.exit(1); }

let nextId = 1;
const sites = data.sites.map(site => {
  const gid = (site.gid || '').toString();
  const gidSafe = gid.replace(/[^a-zA-Z0-9\-]/g, '');
  const iconUrl = gid ? `https://cpsense.heiheigame.com/gameicon/${gidSafe}-icon-128.jpg` : '';
  const newSite = {
    id: nextId++,
    gid: gid,
    pubid: (site.pubid || ''),
    icon: site.icon || iconUrl,
    name: site.name || '',
    path: site.path || ''
  };
  return newSite;
});

data.sites = sites;
fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Normalized', sites.length, 'sites');
