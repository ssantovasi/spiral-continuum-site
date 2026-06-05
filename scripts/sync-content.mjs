/**
 * Sync content + image assets from the private CartographerCipher repo
 * into this public site project.
 *
 * Source layout (sibling private repo):
 *   ../CartographerCipher/site/                       → src/content/site/
 *   ../CartographerCipher/site/books/book{1..8}.md    → src/content/books/
 *   ../CartographerCipher/images/book{N}_v8_cover.png → public/img/
 *   ../CartographerCipher/images/book{N}_v8_back.png  → public/img/
 *   ../CartographerCipher/images/book{N}_spine.png    → public/img/
 *   ../CartographerCipher/images/book{N}_front_flap.png → public/img/
 *   ../CartographerCipher/images/scene_book{N}.png    → public/img/
 *   ../CartographerCipher/images/series_map_book{N}.png → public/img/
 *
 * Run before `astro dev` or `astro build`. On Cloudflare Pages the
 * sibling repo is not available — commit the synced output into this
 * public repo's git history so the deploy build has everything it
 * needs without reaching across repos.
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const PRIVATE_REPO = resolve(ROOT, '..', 'CartographerCipher');

const SITE_SRC   = join(PRIVATE_REPO, 'site');
const IMAGES_SRC = join(PRIVATE_REPO, 'images');

const CONTENT_DIR    = join(ROOT, 'src', 'content');
const BOOKS_CONTENT  = join(CONTENT_DIR, 'books');
const SITE_CONTENT   = join(CONTENT_DIR, 'site');
const PUBLIC_IMG_DIR = join(ROOT, 'public', 'img');

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }
function copy(src, dst) {
  if (!existsSync(src)) {
    console.warn(`  ! missing: ${src}`);
    return false;
  }
  ensureDir(dirname(dst));
  copyFileSync(src, dst);
  return true;
}

function syncBooks() {
  console.log('Books:');
  ensureDir(BOOKS_CONTENT);
  let n = 0;
  for (let i = 1; i <= 8; i++) {
    const src = join(SITE_SRC, 'books', `book${i}.md`);
    const dst = join(BOOKS_CONTENT, `book${i}.md`);
    if (copy(src, dst)) { console.log(`  book${i}.md`); n++; }
  }
  console.log(`  ${n}/8 book markdown files synced`);
}

function syncSiteJson() {
  console.log('Site metadata:');
  ensureDir(SITE_CONTENT);
  for (const f of ['series.json', 'author.json', 'supplement.json']) {
    const src = join(SITE_SRC, f);
    const dst = join(SITE_CONTENT, f);
    if (copy(src, dst)) console.log(`  ${f}`);
  }
}

function syncImages() {
  console.log('Images:');
  ensureDir(PUBLIC_IMG_DIR);
  const patterns = [
    (n) => `book${n}_v8_cover.png`,
    (n) => `book${n}_v8_back.png`,
    (n) => `book${n}_spine.png`,
    (n) => `book${n}_front_flap.png`,
    (n) => `scene_book${n}.png`,
    (n) => `series_map_book${n}.png`,
  ];
  let copied = 0, missing = 0;
  for (let i = 1; i <= 8; i++) {
    for (const p of patterns) {
      const fname = p(i);
      const src = join(IMAGES_SRC, fname);
      const dst = join(PUBLIC_IMG_DIR, fname);
      if (existsSync(src)) {
        copyFileSync(src, dst);
        copied++;
      } else {
        missing++;
        console.warn(`  ! missing: ${fname}`);
      }
    }
  }
  for (const extra of ['series_map_overall.png', 'series_timeline.png']) {
    const src = join(IMAGES_SRC, extra);
    const dst = join(PUBLIC_IMG_DIR, extra);
    if (existsSync(src)) { copyFileSync(src, dst); copied++; }
  }
  console.log(`  ${copied} images copied, ${missing} missing`);
}

function main() {
  if (!existsSync(PRIVATE_REPO)) {
    console.error(`ERROR: private repo not found at ${PRIVATE_REPO}`);
    console.error('Either clone CartographerCipher as a sibling directory, or');
    console.error('skip sync if the synced content is already committed in this repo.');
    process.exit(0);
  }
  console.log(`Syncing from ${PRIVATE_REPO}`);
  console.log(`           to ${ROOT}\n`);
  syncBooks();
  syncSiteJson();
  syncImages();
  console.log('\nDone.');
}

main();
