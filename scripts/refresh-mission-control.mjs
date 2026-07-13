// Refresh the read-only Mission Control snapshot embedded in this site.
//
// Mission Control is a live local dashboard in the sibling IslandOfBones repo
// (../IslandOfBones/mission_control). This script regenerates its static snapshot
// (status/meta JSON + cover thumbnails + headshot), copies the DATA + IMAGES into
// public/mission-control/ here (keeping our own read-only index.html — the triggers,
// voice, console and editing are intentionally omitted), then rebuilds and deploys
// the site.
//
// Usage (from the spiral-continuum-site repo root):
//   npm run refresh:mc                 # refresh snapshot -> build -> deploy live
//   npm run refresh:mc -- --no-deploy  # refresh + build only (no wrangler deploy)
//   npm run refresh:mc -- --commit     # also git add/commit/push the snapshot to main
//
// Requires: python on PATH (stdlib only), and the IslandOfBones repo cloned as a
// sibling directory. No ELEVENLABS_API_KEY needed — the snapshot only reads
// /api/status + /api/meta, which don't touch paid actions.

import { spawn, spawnSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import http from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');                                   // spiral-continuum-site
const MC   = resolve(SITE, '..', 'IslandOfBones', 'mission_control');// sibling dashboard
const DEST = join(SITE, 'public', 'mission-control');
const SRCPUB = join(MC, 'public');
const PORT = 8765;
const PY = process.env.PYTHON || 'python';

const args = process.argv.slice(2);
const doDeploy = !args.includes('--no-deploy');
const doCommit = args.includes('--commit');

const log = (m) => console.log(`\x1b[36m[refresh:mc]\x1b[0m ${m}`);
const die = (m) => { console.error(`\x1b[31m[refresh:mc] ${m}\x1b[0m`); process.exit(1); };
// Pass a full command line (shell:true, no args array) to avoid Node's DEP0190
// warning and to resolve .cmd shims (npm/npx/git) on Windows.
const sh  = (cmdline, opts = {}) => spawnSync(cmdline, { cwd: SITE, stdio: 'inherit', shell: true, ...opts });

// ---- preflight ------------------------------------------------------------
if (!existsSync(MC)) die(`Mission Control source not found:\n    ${MC}\n  Expected the IslandOfBones repo as a sibling of this one.`);
for (const f of ['server.py', 'build_static.py'])
  if (!existsSync(join(MC, f))) die(`${f} missing in ${MC}`);

// ---- 1) start the local dashboard server (no browser popup) ---------------
// Import server.py rather than run it, so its __main__ browser-open never fires.
function ping() {
  return new Promise((res) => {
    const r = http.get({ host: '127.0.0.1', port: PORT, path: '/api/status', timeout: 1500 }, (x) => { x.resume(); res(x.statusCode === 200); });
    r.on('error', () => res(false));
    r.on('timeout', () => { r.destroy(); res(false); });
  });
}
async function waitReady(ms) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await ping()) return true; await new Promise((r) => setTimeout(r, 400)); }
  return false;
}

log('starting Mission Control server on :' + PORT + ' …');
const srv = spawn(
  PY,
  ['-c', `import http.server as h, server; h.ThreadingHTTPServer(('127.0.0.1', ${PORT}), server.Handler).serve_forever()`],
  { cwd: MC, stdio: 'ignore' },
);
let srvExited = false;
srv.on('exit', () => { srvExited = true; });

let ok = false;
try {
  if (!(await waitReady(15000)))
    throw new Error('server never answered on :' + PORT + ' (port busy, or python not on PATH?)');
  log('server ready — baking snapshot (build_static.py) …');
  // ---- 2) bake the static snapshot into ../IslandOfBones/mission_control/public
  const b = spawnSync(PY, ['build_static.py'], { cwd: MC, stdio: 'inherit' });
  if (b.status !== 0) throw new Error('build_static.py failed');
  ok = true;
} finally {
  if (!srvExited) { try { srv.kill(); } catch { /* already gone */ } }
}
if (!ok) die('snapshot build failed');

// ---- 3) copy fresh DATA + IMAGES into the site page -----------------------
// Keep our read-only index.html; take only the view data. Drop tracker.json
// (that's the editable layer — unused by the read-only page).
log('copying snapshot into public/mission-control …');
mkdirSync(join(DEST, 'data'), { recursive: true });
cpSync(join(SRCPUB, 'data', 'status.json'), join(DEST, 'data', 'status.json'));
cpSync(join(SRCPUB, 'data', 'meta.json'),   join(DEST, 'data', 'meta.json'));
if (existsSync(join(DEST, 'data', 'tracker.json'))) unlinkSync(join(DEST, 'data', 'tracker.json'));
rmSync(join(DEST, 'img'), { recursive: true, force: true });          // clear stale covers
cpSync(join(SRCPUB, 'img'), join(DEST, 'img'), { recursive: true });
if (existsSync(join(SRCPUB, 'headshot.jpg'))) cpSync(join(SRCPUB, 'headshot.jpg'), join(DEST, 'headshot.jpg'));

// ---- 4) build ------------------------------------------------------------
log('building site (astro build) …');
if (sh('npm run build').status !== 0) die('astro build failed');

// ---- 5) deploy -----------------------------------------------------------
if (doDeploy) {
  log('deploying (wrangler deploy) …');
  if (sh('npx --no-install wrangler deploy').status !== 0) die('wrangler deploy failed');
} else {
  log('skipped deploy (--no-deploy)');
}

// ---- 6) optional commit + push -------------------------------------------
if (doCommit) {
  sh('git add public/mission-control');
  if (sh('git commit -m "Refresh Mission Control snapshot"').status === 0) sh('git push origin main');
  else log('nothing to commit — snapshot unchanged');
}

log('done ✓  https://stevensaintbooks.com/mission-control/');
if (!doCommit) log('snapshot is uncommitted — run with --commit (or `git add public/mission-control && git commit`) to persist it.');
