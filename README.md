# spiral-continuum-site

Public website for *The Spiral Continuum* by Steven Saint.

Astro static site, deployed to Cloudflare Pages.
Source content is synced from the private `CartographerCipher` repo
via `scripts/sync-content.mjs` and committed into this repo so the
Cloudflare build has everything it needs.

## Local development

```
npm install
npm run sync   # copy content + images from ../CartographerCipher
npm run dev    # local dev server at http://localhost:4321
```

`npm run sync` requires the private `CartographerCipher` repo to be
cloned as a sibling directory. If you don't have access, the synced
content is already committed in `src/content/` and `public/img/` and
you can skip the sync step.

## Build for production

```
npm run sync   # ensure content is fresh
npm run build  # outputs static site to dist/
npm run preview
```

## Deploy

Cloudflare Pages is wired to this repo's `main` branch. Push to main
and Cloudflare auto-builds and deploys to the configured custom
domain (`stevensaintbooks.com`).

Cloudflare Pages build settings:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node version**: 22+

## Structure

```
src/
├── content/
│   ├── books/          synced book{1..8}.md (Content Collection)
│   ├── site/           synced series.json / author.json / supplement.json
│   └── config.ts       collection schema
├── layouts/
│   └── Layout.astro    base layout (header / footer / brand)
├── pages/
│   ├── index.astro     series landing — eight-book grid
│   ├── books/[id].astro  per-book detail (dynamic route)
│   ├── author.astro    Steven Saint bio + series list
│   └── supplement.astro  maps + timeline PDF landing page
├── styles/
│   └── global.css      parchment + iron-gall palette
public/
└── img/                synced cover / scene / spine / map PNGs
scripts/
└── sync-content.mjs    copies from ../CartographerCipher
```

## Source of truth

- Per-book MD frontmatter → `CartographerCipher/site/books/book{N}.md`
- Series metadata → `CartographerCipher/site/series.json`
- Author bio → `CartographerCipher/site/author.json`
- Supplement info → `CartographerCipher/site/supplement.json`
- Cover art → `CartographerCipher/images/book{N}_v8_cover.png`
- Scene plates → `CartographerCipher/images/scene_book{N}.png`

Update those files in the private repo, run `npm run sync` here,
commit, push. Cloudflare auto-deploys.
