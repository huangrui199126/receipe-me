/**
 * Restructures docs/data/ into per-recipe folders:
 *   docs/data/recipes/tr_1/recipe.json  + cover.jpg + step_1.jpg ...
 *   docs/data/index.json   ← lightweight list for app discovery
 *
 * All images are downloaded and hosted on GitHub Pages so the app
 * never depends on fal.ai CDN or Unsplash (both can expire/change).
 *
 * Run: node scripts/restructureData.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'docs', 'data');
const RECIPES_DIR = join(DATA_DIR, 'recipes');

const GITHUB_PAGES_BASE = 'https://huangrui199126.github.io/receipe-me/data/recipes';

// ── helpers ──────────────────────────────────────────────────────────────────

async function downloadImage(url, destPath) {
  if (!url || url.startsWith('/') || url.startsWith('./')) return false;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn(`  ✗ HTTP ${res.status} for ${url}`); return false; }
    const buf = await res.arrayBuffer();
    writeFileSync(destPath, Buffer.from(buf));
    return true;
  } catch (e) {
    console.warn(`  ✗ fetch error: ${e.message}`);
    return false;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── main ─────────────────────────────────────────────────────────────────────

const source = JSON.parse(readFileSync(join(DATA_DIR, 'trending.json'), 'utf8'));
const recipes = source.recipes;

mkdirSync(RECIPES_DIR, { recursive: true });

const indexEntries = [];

for (const recipe of recipes) {
  const dir = join(RECIPES_DIR, recipe.id);
  mkdirSync(dir, { recursive: true });

  console.log(`\n📖 ${recipe.id}: ${recipe.title}`);

  // ── 1. Download cover image ──────────────────────────────────────────────
  const coverDest = join(dir, 'cover.jpg');
  let coverUrl = `${GITHUB_PAGES_BASE}/${recipe.id}/cover.jpg`;

  if (!existsSync(coverDest)) {
    process.stdout.write('  cover... ');
    const ok = await downloadImage(recipe.image, coverDest);
    console.log(ok ? '✓' : '✗ (keeping original URL)');
    if (!ok) coverUrl = recipe.image; // fall back to original
  } else {
    console.log('  cover already downloaded');
  }
  await sleep(100);

  // ── 2. Download step images ──────────────────────────────────────────────
  const steps = recipe.steps.map(async (step) => {
    if (!step.imageUri) return step;

    const filename = `step_${step.order}.jpg`;
    const destPath = join(dir, filename);
    const ghUrl = `${GITHUB_PAGES_BASE}/${recipe.id}/${filename}`;

    if (!existsSync(destPath)) {
      process.stdout.write(`  step_${step.order}... `);
      const ok = await downloadImage(step.imageUri, destPath);
      console.log(ok ? '✓' : '✗ (keeping fal.ai URL)');
      await sleep(80);
      return { ...step, imageUri: ok ? ghUrl : step.imageUri };
    } else {
      return { ...step, imageUri: ghUrl };
    }
  });

  const resolvedSteps = await Promise.all(steps);

  // ── 3. Write recipe.json ─────────────────────────────────────────────────
  const recipeJson = {
    ...recipe,
    image: coverUrl,
    steps: resolvedSteps,
  };
  writeFileSync(join(dir, 'recipe.json'), JSON.stringify(recipeJson, null, 2));
  console.log(`  ✓ recipe.json written`);

  // ── 4. Add to index ──────────────────────────────────────────────────────
  indexEntries.push({
    id: recipe.id,
    title: recipe.title,
    image: coverUrl,
    sourcePlatform: recipe.sourcePlatform,
    importCount: recipe.importCount,
    healthScore: recipe.healthScore,
    nutrition: recipe.nutrition,
    tags: recipe.tags,
  });
}

// ── 5. Write index.json ──────────────────────────────────────────────────────
const index = {
  version: 2,
  updatedAt: new Date().toISOString(),
  recipeCount: indexEntries.length,
  recipes: indexEntries,
  // App fetches full recipe from: /data/recipes/{id}/recipe.json
  recipeBaseUrl: `${GITHUB_PAGES_BASE}`,
};
writeFileSync(join(DATA_DIR, 'index.json'), JSON.stringify(index, null, 2));
console.log(`\n✅ index.json written with ${indexEntries.length} entries`);
console.log(`\nFolder structure:`);
console.log(`  docs/data/index.json`);
console.log(`  docs/data/recipes/tr_N/recipe.json`);
console.log(`  docs/data/recipes/tr_N/cover.jpg`);
console.log(`  docs/data/recipes/tr_N/step_N.jpg`);
