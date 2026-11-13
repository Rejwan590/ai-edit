// Fails the build if banned fake/mock patterns or committed secrets are found.
// Policy: docs/REAL-TESTING.md (D20) and AGENTS.md. Scans code folders, not docs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const FAIL_DIRS = ['apps', 'packages'];            // violations fail the build
const WARN_DIRS = ['ui-export'];                   // violations warn (H1 removes them)
const SECRET_SCAN_DIRS = ['.', ];                  // secrets always fail, everywhere
const SKIP = new Set(['node_modules', '.git', 'dist', 'out', 'build', '.vite', 'coverage', 'test-media', 'reference']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css', '.py']);

const BANNED = [
  [/demoClient/, 'demoClient (demo mode is banned)'],
  [/[?&]demo=1/, '?demo=1 (demo mode is banned)'],
  [/Demo data/i, '"Demo data" badge (demo mode is banned)'],
  [/\bvi\.mock\(/, 'vi.mock( (mocks are banned)'],
  [/\bjest\.mock\(/, 'jest.mock( (mocks are banned)'],
  [/sinon\.stub\(/, 'sinon.stub( (mocks are banned)'],
  [/lorem ipsum/i, 'lorem ipsum placeholder text'],
  [/sample[ _-]project/i, 'sample project (no sample data)'],
];
const SECRETS = [
  [/AIza[0-9A-Za-z_\-]{35}/, 'Google API key'],
  [/sk-[A-Za-z0-9]{32,}/, 'secret key (sk-...)'],
  [/sk-ant-[A-Za-z0-9_\-]{20,}/, 'Anthropic key'],
  [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'private key'],
  [/ghp_[A-Za-z0-9]{30,}/, 'GitHub token'],
];

function* walk(dir) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) yield* walk(p);
    else if (st.size < 2_000_000) yield p;
  }
}
function scan(dirs, rules, onlyCode) {
  const hits = [];
  for (const d of dirs) for (const f of walk(join(ROOT, d))) {
    if (relative(ROOT, f) === 'scripts/no-fakes-check.mjs') continue;
    if (onlyCode && !CODE_EXT.has(extname(f))) continue;
    let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
    const lines = text.split('\n');
    lines.forEach((line, i) => rules.forEach(([re, why]) => { if (re.test(line)) hits.push(`${relative(ROOT, f)}:${i + 1}  ${why}`); }));
  }
  return hits;
}
const fail = scan(FAIL_DIRS, BANNED, true);
const warn = scan(WARN_DIRS, BANNED, true);
const secrets = scan(SECRET_SCAN_DIRS, SECRETS, false).filter(h => !h.startsWith('docs/') || true);
if (warn.length) { console.warn(`WARN (${warn.length}) in ui-export (prompt H1 removes these):`); warn.slice(0, 20).forEach(h => console.warn('  ' + h)); }
if (fail.length) { console.error(`FAIL (${fail.length}) banned fake/mock patterns:`); fail.forEach(h => console.error('  ' + h)); }
if (secrets.length) { console.error(`FAIL (${secrets.length}) possible secrets committed:`); secrets.forEach(h => console.error('  ' + h)); }
if (fail.length || secrets.length) process.exit(1);
console.log('no-fakes-check: OK');
