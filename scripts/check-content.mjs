// Run with: npm run check:content
// Photo fields in the CMS are tied to a folder. If a content file points a field at a photo from a
// different folder (or at a missing file), the admin can't save that entry ("a path was requested
// for deletion which does not exist"). This catches that before it reaches the owners.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const config = readFileSync('keystatic.config.tsx', 'utf8');
const folderFor = {};
for (const m of config.matchAll(/(\w+):\s*photo\('[^']*',\s*'(\w+)'/g)) folderFor[m[1]] = m[2];

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.(ya?ml|md)$/.test(n) ? [p] : []; });
let problems = 0, checked = 0;
for (const file of walk('src/content')) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(?:- )?(\w+):\s*['"]?(\/src\/assets\/images\/[^'"\s]+)/);
    if (!m) return;
    const [, key, path] = m; checked++;
    const folder = path.split('/')[4];
    if (!existsSync(path.slice(1))) { problems++; console.error(`MISSING FILE  ${file}:${i + 1}  ${key} = ${path}`); }
    else if (folderFor[key] && folderFor[key] !== folder) { problems++; console.error(`WRONG FOLDER  ${file}:${i + 1}  ${key} = ${path}  (this field uses "${folderFor[key]}")`); }
  });
}
console.log(`${checked} photo values checked, ${problems} problem${problems === 1 ? '' : 's'}.`);
process.exit(problems ? 1 : 0);
