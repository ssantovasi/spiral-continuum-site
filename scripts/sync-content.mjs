/**
 * Sync content + image assets from BOTH private series repos into this
 * public site project.
 *
 * Sources (sibling private repos):
 *   ../CartographerCipher/site/                     → src/content/site/
 *   ../CartographerCipher/site/books/book{N}.md     → src/content/books/
 *   ../CartographerCipher/images/{cover,back,spine,flap,scene,map}.png → public/img/
 *
 *   ../IslandOfBones/site/                          → src/content/iob-site/
 *   ../IslandOfBones/site/books/book{N}.md          → src/content/iob-books/
 *   ../IslandOfBones/images/{front,back,spine,flap}.png → public/img/iob/
 *
 * Synced output is committed in this repo so Cloudflare Pages CI can
 * build without access to the private repos.
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SIBLING = resolve(ROOT, '..');

const SPIRAL_REPO = join(SIBLING, 'CartographerCipher');
const IOB_REPO    = join(SIBLING, 'IslandOfBones');

const CONTENT_DIR     = join(ROOT, 'src', 'content');
const SPIRAL_BOOKS    = join(CONTENT_DIR, 'books');
const SPIRAL_SITE     = join(CONTENT_DIR, 'site');
const IOB_BOOKS       = join(CONTENT_DIR, 'iob-books');
const IOB_SITE        = join(CONTENT_DIR, 'iob-site');
const PUBLIC_IMG      = join(ROOT, 'public', 'img');
const PUBLIC_IMG_IOB  = join(PUBLIC_IMG, 'iob');

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }
function copy(src, dst) {
  if (!existsSync(src)) return false;
  ensureDir(dirname(dst));
  copyFileSync(src, dst);
  return true;
}

function syncSpiral() {
  console.log('--- Spiral Continuum ---');
  if (!existsSync(SPIRAL_REPO)) {
    console.warn(`  skipped: ${SPIRAL_REPO} not found`);
    return;
  }
  ensureDir(SPIRAL_BOOKS);
  ensureDir(SPIRAL_SITE);
  ensureDir(PUBLIC_IMG);

  let books = 0;
  for (let i = 1; i <= 8; i++) {
    if (copy(
      join(SPIRAL_REPO, 'site', 'books', `book${i}.md`),
      join(SPIRAL_BOOKS, `book${i}.md`)
    )) books++;
  }
  console.log(`  books: ${books}/8 .md`);

  let site = 0;
  for (const f of ['series.json', 'author.json', 'supplement.json']) {
    if (copy(join(SPIRAL_REPO, 'site', f), join(SPIRAL_SITE, f))) site++;
  }
  console.log(`  site metadata: ${site}/3 .json`);

  const patterns = [
    (n) => `book${n}_v8_cover.png`,
    (n) => `book${n}_v8_back.png`,
    (n) => `book${n}_spine.png`,
    (n) => `book${n}_front_flap.png`,
    (n) => `scene_book${n}.png`,
    (n) => `series_map_book${n}.png`,
    (n) => `series_map_book${n}_photo.png`,
  ];
  let imgs = 0;
  for (let i = 1; i <= 8; i++) {
    for (const p of patterns) {
      if (copy(join(SPIRAL_REPO, 'images', p(i)), join(PUBLIC_IMG, p(i)))) imgs++;
    }
  }
  for (const extra of [
    'series_map_overall.png',
    'series_map_overall_photo.png',
    'series_timeline.png',
    'series_timeline_photo.png',
  ]) {
    if (copy(join(SPIRAL_REPO, 'images', extra), join(PUBLIC_IMG, extra))) imgs++;
  }
  console.log(`  images: ${imgs} copied`);
}

function syncIoB() {
  console.log('--- Island of Bones ---');
  if (!existsSync(IOB_REPO)) {
    console.warn(`  skipped: ${IOB_REPO} not found`);
    return;
  }
  ensureDir(IOB_BOOKS);
  ensureDir(IOB_SITE);
  ensureDir(PUBLIC_IMG_IOB);

  let books = 0;
  for (let i = 1; i <= 9; i++) {
    if (copy(
      join(IOB_REPO, 'site', 'books', `book${i}.md`),
      join(IOB_BOOKS, `book${i}.md`)
    )) books++;
  }
  console.log(`  books: ${books}/9 .md`);

  if (copy(join(IOB_REPO, 'site', 'series.json'), join(IOB_SITE, 'series.json'))) {
    console.log(`  site metadata: series.json`);
  }

  const patterns = [
    (n) => `book${n}_front.png`,
    (n) => `book${n}_v8_back.png`,
    (n) => `book${n}_spine.png`,
    (n) => `book${n}_front_flap.png`,
  ];
  let imgs = 0;
  for (let i = 1; i <= 9; i++) {
    for (const p of patterns) {
      if (copy(join(IOB_REPO, 'images', p(i)), join(PUBLIC_IMG_IOB, p(i)))) imgs++;
    }
  }
  console.log(`  images: ${imgs} copied (only what exists is synced)`);
}

function main() {
  console.log(`Syncing into ${ROOT}\n`);
  syncSpiral();
  console.log('');
  syncIoB();
  console.log('\nDone.');
}

main();
