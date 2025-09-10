const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');

function backup(originalPath) {
  const ts = Date.now();
  const bakPath = originalPath + `.bak.${ts}`;
  fs.copyFileSync(originalPath, bakPath);
  return bakPath;
}

function looksLikeFile(url) {
  // crude heuristic: last path segment contains a dot and 1-5 char extension-like part
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop();
    if (!seg) return false;
    return /\.[a-zA-Z0-9]{1,5}$/.test(seg);
  } catch (e) {
    return false;
  }
}

function ensureTrailingSlash(url) {
  try {
    const u = new URL(url);
    if (u.pathname.endsWith('/')) return url;
    if (looksLikeFile(url)) return url; // don't add slash to file paths
    u.pathname = u.pathname + '/';
    return u.toString();
  } catch (e) {
    return url;
  }
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

  let changed = 0;

  function maybeFixField(obj, key) {
    if (!obj || typeof obj[key] !== 'string') return;
    const val = obj[key].trim();
    if (/^https?:\/\//i.test(val)) {
      const fixed = ensureTrailingSlash(val);
      if (fixed !== val) {
        obj[key] = fixed;
        changed++;
      }
    }
  }

  if (Array.isArray(data.sites)) {
    data.sites.forEach(site => {
      maybeFixField(site, 'path');
      maybeFixField(site, 'pathBeta');
      maybeFixField(site, 'url');
    });
  }

  if (Array.isArray(data.categories)) {
    data.categories.forEach(cat => {
      maybeFixField(cat, 'path');
      maybeFixField(cat, 'url');
    });
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${changed} url(s).`);
}

main();
