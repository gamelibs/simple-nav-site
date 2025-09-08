const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'src', 'data.json');
const backup = file + '.bak';
let text = fs.readFileSync(file, 'utf8');
fs.writeFileSync(backup, text);
console.log('Backup written to', backup);

// 1) Remove trailing commas before } or ]
text = text.replace(/,\s*(\n\s*[}\]])/g, '$1');

// 2) Insert missing commas between properties when a line ends with a quote and next non-empty line starts with a quote (a key)
const lines = text.split(/\r?\n/);
for (let i = 0; i < lines.length - 1; i++) {
  const cur = lines[i].trimEnd();
  const next = lines[i+1].trimStart();
  if (cur.endsWith('"') && next.startsWith('"')) {
    // only add comma if current line doesn't already end with a comma
    if (!cur.endsWith(',')) {
      lines[i] = lines[i].replace(/\s*$/, '') + ',';
    }
  }
}
text = lines.join('\n');

// 3) Fix any accidental unescaped newlines in string values by ensuring closing quotes exist
// (This is risky; we'll only attempt naive fixes: if a line contains "name": "... without closing quote on same line, try to join until a closing quote found)
const repaired = [];
for (let i=0;i<lines.length;i++){
  let line = lines[i];
  if (/"\w+"\s*:\s*"[^"]*$/.test(line)) {
    // line has an opening quote without a closing quote
    let j = i+1;
    while (j < lines.length && !lines[j].includes('"')) {
      line += '\\n' + lines[j];
      j++;
    }
    if (j < lines.length) {
      line += '\\n' + lines[j];
      i = j; // skip ahead
    }
  }
  repaired.push(line);
}
text = repaired.join('\n');

fs.writeFileSync(file, text, 'utf8');
console.log('Wrote repaired file to', file);

try {
  const obj = JSON.parse(fs.readFileSync(file,'utf8'));
  console.log('PARSE_OK');
  console.log('sites length:', obj.sites && obj.sites.length);
} catch (e) {
  console.error('PARSE_ERROR');
  console.error(e && e.message);
  process.exit(2);
}
