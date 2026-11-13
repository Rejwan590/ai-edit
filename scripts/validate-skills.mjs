// Validates skills/: JSON parses, required fields exist, SKILL.md frontmatter is present.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const ROOT = process.cwd(); const errors = [];
function* walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? yield* walk(p) : yield p; } }
let count = { style: 0, effect: 0, skill: 0 };
try {
  for (const f of walk(join(ROOT, 'skills'))) {
    const rel = relative(ROOT, f);
    if (f.endsWith('look.json')) {
      count.style++;
      try { const j = JSON.parse(readFileSync(f, 'utf8'));
        for (const k of ['id', 'name', 'description', 'bestLength', 'footage', 'avoidWhen', 'tags', 'look']) if (!(k in j)) errors.push(`${rel}: missing "${k}"`);
        for (const k of ['palette', 'fonts', 'captions', 'cards', 'motion']) if (j.look && !(k in j.look)) errors.push(`${rel}: look missing "${k}"`);
      } catch (e) { errors.push(`${rel}: ${e.message}`); }
    } else if (f.endsWith('effect.json')) {
      count.effect++;
      try { const j = JSON.parse(readFileSync(f, 'utf8'));
        for (const k of ['id', 'name', 'group', 'description', 'scope', 'params', 'safety']) if (!(k in j)) errors.push(`${rel}: missing "${k}"`);
        for (const [pn, p] of Object.entries(j.params || {})) {
          if (p.type === 'number' && !(p.min <= p.default && p.default <= p.max)) errors.push(`${rel}: param ${pn} default outside min/max`);
          if (p.type === 'enum' && !p.options?.includes(p.default)) errors.push(`${rel}: param ${pn} default not in options`);
        }
      } catch (e) { errors.push(`${rel}: ${e.message}`); }
    } else if (f.endsWith('SKILL.md')) {
      count.skill++;
      const t = readFileSync(f, 'utf8');
      const m = t.match(/^---\n([\s\S]*?)\n---/);
      if (!m) errors.push(`${rel}: missing frontmatter`);
      else for (const k of ['name', 'description', 'kind']) if (!new RegExp(`^${k}:`, 'm').test(m[1])) errors.push(`${rel}: frontmatter missing "${k}"`);
    }
  }
} catch (e) { errors.push(e.message); }
if (errors.length) { console.error('validate-skills FAIL:'); errors.forEach(e => console.error('  ' + e)); process.exit(1); }
console.log(`validate-skills: OK (${count.style} styles, ${count.effect} effects, ${count.skill} SKILL.md)`);
