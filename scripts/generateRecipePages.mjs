/**
 * Generates static HTML pages for each trending recipe at:
 *   docs/recipe/tr_N/index.html
 *
 * Each page has Open Graph meta tags so sharing the link in
 * iMessage / WhatsApp / Twitter shows a rich preview with food photo.
 *
 * Run: node scripts/generateRecipePages.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'docs', 'data', 'recipes');
const OUT_DIR = join(ROOT, 'docs', 'recipe');
const BASE = 'https://huangrui199126.github.io/receipe-me';

const recipeIds = ['tr_1','tr_2','tr_3','tr_4','tr_5','tr_6','tr_7','tr_8','tr_9','tr_10'];

mkdirSync(OUT_DIR, { recursive: true });

for (const id of recipeIds) {
  const recipe = JSON.parse(readFileSync(join(DATA_DIR, id, 'recipe.json'), 'utf8'));
  const dir = join(OUT_DIR, id);
  mkdirSync(dir, { recursive: true });

  const imageUrl = recipe.image?.startsWith('http')
    ? recipe.image
    : `${BASE}/data/recipes/${id}/cover.jpg`;

  const description = `${recipe.servings} servings · ${recipe.prepTime + recipe.cookTime} min · ${recipe.nutrition?.calories ?? '?'} cal · ${recipe.nutrition?.protein ?? '?'}g protein`;

  const ingredientList = recipe.ingredients
    ?.slice(0, 6)
    .map(i => `<li>${i.emoji ?? ''} <strong>${i.amount} ${i.unit}</strong> ${i.name}</li>`)
    .join('\n') ?? '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${recipe.title} — ReciMe</title>

  <!-- Open Graph (iMessage, WhatsApp, Twitter rich preview) -->
  <meta property="og:title" content="${recipe.title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="600" />
  <meta property="og:image:height" content="400" />
  <meta property="og:url" content="${BASE}/recipe/${id}/" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ReciMe" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${recipe.title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F0E8; color: #1A1A1A; }
    .hero { width: 100%; height: 280px; object-fit: cover; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 20px; }
    .badge { display: inline-block; background: #F97316; color: white; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 12px; line-height: 1.3; }
    .meta { display: flex; gap: 16px; color: #6B7280; font-size: 14px; margin-bottom: 20px; }
    .nutrition { display: flex; gap: 16px; background: white; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .nut-cell { flex: 1; text-align: center; }
    .nut-val { font-size: 20px; font-weight: 700; }
    .nut-lbl { font-size: 11px; color: #6B7280; margin-top: 2px; }
    .section-title { font-size: 12px; font-weight: 700; color: #3B82F6; letter-spacing: 0.8px; margin-bottom: 12px; margin-top: 24px; }
    ul { list-style: none; }
    ul li { padding: 8px 0; border-bottom: 1px solid #E5E0D8; font-size: 15px; }
    .app-banner { background: #F97316; color: white; border-radius: 14px; padding: 20px; text-align: center; margin-top: 32px; }
    .app-banner h3 { font-size: 18px; margin-bottom: 8px; }
    .app-banner p { font-size: 14px; opacity: 0.9; }
    .logo { font-size: 24px; font-weight: 800; font-style: italic; color: #F97316; margin-bottom: 4px; }
  </style>
</head>
<body>
  <img class="hero" src="${imageUrl}" alt="${recipe.title}" />
  <div class="container">
    <div class="logo">ReciMe</div>
    <div class="badge">${recipe.sourcePlatform ?? 'Trending'} · ↑ ${recipe.importCount ?? ''} saves</div>
    <h1>${recipe.title}</h1>
    <div class="meta">
      <span>⏱ ${(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min</span>
      <span>🍽 ${recipe.servings} servings</span>
      <span>🔥 ${recipe.healthScore}/10 health score</span>
    </div>
    ${recipe.nutrition ? `
    <div class="nutrition">
      <div class="nut-cell"><div class="nut-val">${recipe.nutrition.calories}</div><div class="nut-lbl">Calories</div></div>
      <div class="nut-cell"><div class="nut-val">${recipe.nutrition.protein}g</div><div class="nut-lbl">Protein</div></div>
      <div class="nut-cell"><div class="nut-val">${recipe.nutrition.carbs}g</div><div class="nut-lbl">Carbs</div></div>
      <div class="nut-cell"><div class="nut-val">${recipe.nutrition.fat}g</div><div class="nut-lbl">Fat</div></div>
    </div>` : ''}
    <div class="section-title">INGREDIENTS</div>
    <ul>${ingredientList}</ul>
    <div class="app-banner">
      <h3>Save this recipe in ReciMe</h3>
      <p>Import recipes from Instagram, TikTok & Pinterest. Plan meals, build grocery lists, and cook step-by-step.</p>
    </div>
  </div>
</body>
</html>`;

  writeFileSync(join(dir, 'index.html'), html);
  console.log(`✓ ${id}: ${recipe.title}`);
}

console.log(`\n✅ Generated ${recipeIds.length} recipe pages at docs/recipe/tr_N/index.html`);
