const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data.json');
const backupPath = path.join(__dirname, '..', 'src', 'data.json.bak2');

function sanitizeName(name) {
  if (!name) return '';
  return name.replace(/\s+/g, '');
}

function replaceLastSegment(originalPath, newSegment) {
  if (!originalPath) return originalPath;
  try {
    const parsed = new URL(originalPath);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return originalPath;
    parts[parts.length - 1] = newSegment;
    parsed.pathname = '/' + parts.join('/');
    return parsed.toString();
  } catch (e) {
    // Not a full URL? fallback to string manipulation
    const idx = originalPath.lastIndexOf('/');
    if (idx === -1) return newSegment;
    return originalPath.slice(0, idx + 1) + newSegment;
  }
}

function main() {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);

  fs.writeFileSync(backupPath, raw, 'utf8');
  console.log('Backup created at', backupPath);

  let changed = 0;
  data.sites = data.sites.map(site => {
    const newSeg = sanitizeName(site.name || '');
    if (!newSeg) return site;
    const newPath = replaceLastSegment(site.path || '', newSeg);
    if (newPath !== site.path) {
      changed++;
      return { ...site, path: newPath };
    }
    return site;
  });

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote updated data.json. Sites updated: ${changed}`);
}

main();
