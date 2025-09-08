const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../src/data.json');
const backupPath = path.resolve(__dirname, '../src/data.json.bak');

// Assumptions:
// - When replacing path, we will set it to the base URL + gid, e.g. https://cpsense.heiheigame.com/douyou_release/001
// - If site.gid is missing, we'll leave path unchanged but still add categoryId based on existing path string.
// - Mapping: 'douyou_release' => 1, 'douyou_other' => 2, otherwise 0

try {
  fs.copyFileSync(dataPath, backupPath);
  console.log('Backup created at', backupPath);

  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);

  const base = 'https://cpsense.heiheigame.com/douyou_release/';

  let updated = 0;
  data.sites = (data.sites || []).map(site => {
    const originalPath = site.path || '';
    const lower = String(originalPath).toLowerCase();

    // categoryId
    if (lower.includes('douyou_other')) {
      site.categoryId = 2;
    } else if (lower.includes('douyou_release')) {
      site.categoryId = 1;
    } else if (site.categoryId == null) {
      site.categoryId = 0;
    }

    // path replacement: set to base + gid when gid exists, otherwise keep original but prefix base
    if (site.gid) {
      const gidStr = String(site.gid).replace(/[^a-zA-Z0-9_-]/g, '');
      const newPath = base + gidStr;
      if (site.path !== newPath) {
        site.path = newPath;
        updated++;
      }
    } else {
      // no gid: if path contains douyou_release/other, replace with base, else keep
      if (lower.includes('douyou_release') || lower.includes('douyou_other')) {
        site.path = base;
        updated++;
      }
    }

    return site;
  });

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote updated data.json. Sites updated:', updated);

  // Print a small sample
  const sample = data.sites.slice(0, 5).map(s => ({ id: s.id, gid: s.gid, pubid: s.pubid, path: s.path, categoryId: s.categoryId }));
  console.log('Sample:', sample);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
