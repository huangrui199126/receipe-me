/**
 * Read generatedStepImages.json and inject imageUri into each step
 * in trendingRecipes.ts — matched by recipe ID block and step order.
 */
import { readFileSync, writeFileSync } from 'fs';

const results = JSON.parse(readFileSync('./scripts/generatedStepImages.json', 'utf8'));
let content = readFileSync('./lib/trendingRecipes.ts', 'utf8');

// Split the file into recipe blocks using the id field as delimiter
// Each block starts with "id: 'tr_N'"
const recipeIds = Object.keys(results); // ['tr_1', 'tr_2', ...]

for (const recipeId of recipeIds) {
  const stepImages = results[recipeId]; // { '1': url, '2': url, ... }

  for (const [orderStr, url] of Object.entries(stepImages)) {
    if (!url) continue;
    const order = parseInt(orderStr);

    // Find the recipe block for this ID, then within it find the step
    // Strategy: locate "id: 'tr_N'" then find the N-th step occurrence
    const recipeStart = content.indexOf(`id: '${recipeId}'`);
    const nextRecipeStart = recipeIds
      .map(id => content.indexOf(`id: '${id}'`, recipeStart + 1))
      .filter(i => i > recipeStart)
      .sort((a, b) => a - b)[0] ?? content.length;

    const recipeBlock = content.slice(recipeStart, nextRecipeStart);

    // Find the step with this order number (match "{ order: N, instruction:")
    const stepPattern = new RegExp(`(\\{ order: ${order}, instruction: '[^']*')`, 'g');
    const matches = [...recipeBlock.matchAll(stepPattern)];

    if (matches.length === 0) {
      console.warn(`No match for ${recipeId} step ${order}`);
      continue;
    }

    // Only patch the FIRST match (there should only be one per recipe)
    const match = matches[0];
    const matchStart = recipeStart + match.index;
    const matchEnd = matchStart + match[0].length;
    const replacement = match[0] + `, imageUri: '${url}'`;
    content = content.slice(0, matchStart) + replacement + content.slice(matchEnd);
  }
}

writeFileSync('./lib/trendingRecipes.ts', content);

// Verify
const count = (content.match(/imageUri: 'https:\/\/v3b\.fal/g) || []).length;
console.log(`✅ Injected ${count} step imageUris (expected 52)`);
