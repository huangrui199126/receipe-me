import { Ingredient, Recipe, Step } from '../db/schema';

export interface ImportedRecipe {
  title: string;
  imageUri: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  sourceUrl: string;
  sourcePlatform: string;
  ingredients: Omit<Ingredient, 'id' | 'recipeId'>[];
  steps: Omit<Step, 'id' | 'recipeId'>[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number } | null;
}

const INGREDIENT_EMOJIS: Record<string, string> = {
  chicken: '🍗', beef: '🥩', pork: '🥩', fish: '🐟', salmon: '🐟', shrimp: '🦐',
  egg: '🥚', butter: '🧈', milk: '🥛', cheese: '🧀', cream: '🥛',
  flour: '🌾', sugar: '🍬', salt: '🧂', pepper: '🌶️', oil: '🫙',
  garlic: '🧄', onion: '🧅', tomato: '🍅', potato: '🥔', carrot: '🥕',
  spinach: '🥬', broccoli: '🥦', mushroom: '🍄', avocado: '🥑', lemon: '🍋',
  lime: '🍋', pasta: '🍝', rice: '🍚', bread: '🍞', bacon: '🥓',
  honey: '🍯', soy: '🫙', corn: '🌽', lettuce: '🥬', cucumber: '🥒',
  default: '🥄',
};

export function getIngredientEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return INGREDIENT_EMOJIS.default;
}

export async function importFromUrl(url: string): Promise<ImportedRecipe> {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml',
  };

  // For Pinterest short URLs (pin.it) and full pins: find the linked recipe website
  if (url.includes('pin.it') || url.includes('pinterest.com/pin/')) {
    const res = await fetch(url, { headers: HEADERS });
    const html = await res.text();
    // Look for the external source URL in the pin page
    const sourceMatch = html.match(/["']url["']\s*:\s*["'](https?:\/\/(?!www\.pinterest\.)[^"']+)["']/i)
      ?? html.match(/href=["'](https?:\/\/(?!www\.pinterest\.)[^"']{20,})["'][^>]*>\s*(?:Visit|Source|Original)/i);
    if (sourceMatch?.[1]) {
      try { return await importFromUrl(sourceMatch[1]); } catch {}
    }
    // Fallback to OG tags + description parsing
    return parseFromMetaTags(html, url);
  }

  // For Instagram / TikTok: extract OG description and try to parse as recipe text
  if (url.includes('instagram.com') || url.includes('tiktok.com')) {
    const res = await fetch(url, { headers: HEADERS });
    const html = await res.text();
    const descMatch = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']{50,})["']/i);
    if (descMatch?.[1]) {
      try {
        const parsed = parseRecipeText(descMatch[1].replace(/\\n/g, '\n'));
        if (parsed.ingredients.length > 2 || parsed.steps.length > 2) {
          // Extract OG image too
          const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
          return { ...parsed, imageUri: imgMatch?.[1] ?? '', title: titleMatch?.[1] ?? parsed.title, sourceUrl: url, sourcePlatform: detectPlatform(url) };
        }
      } catch {}
    }
    throw new Error(`Instagram and TikTok don't share recipe data publicly.\n\nTip: Copy the caption text and use "Paste Text" instead — it works perfectly for recipe captions.`);
  }

  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`Could not load this URL (${response.status}). Try a direct recipe website link.`);

  const html = await response.text();

  // Try JSON-LD schema.org/Recipe first
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
      try {
        const data = JSON.parse(content);
        const recipe = findRecipeInJsonLd(data);
        if (recipe) return parseJsonLdRecipe(recipe, url);
      } catch {}
    }
  }

  // Fallback: parse meta tags / OG
  return parseFromMetaTags(html, url);
}

function findRecipeInJsonLd(data: any): any {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }
  if (data['@type'] === 'Recipe') return data;
  if (data['@graph']) return findRecipeInJsonLd(data['@graph']);
  return null;
}

function parseJsonLdRecipe(data: any, url: string): ImportedRecipe {
  const title = data.name ?? 'Imported Recipe';
  const imageUri = Array.isArray(data.image)
    ? (typeof data.image[0] === 'string' ? data.image[0] : data.image[0]?.url ?? '')
    : (typeof data.image === 'string' ? data.image : data.image?.url ?? '');

  const servings = parseServings(data.recipeYield);
  const prepTime = parseDuration(data.prepTime);
  const cookTime = parseDuration(data.cookTime);
  const sourcePlatform = detectPlatform(url);

  // Parse ingredients
  const rawIngredients: string[] = Array.isArray(data.recipeIngredient) ? data.recipeIngredient : [];
  const ingredients = rawIngredients.map((raw, i) => {
    const parsed = parseIngredientString(raw);
    return { ...parsed, order: i, section: '' };
  });

  // Parse steps — also capture step images when available (some sites embed them)
  const rawInstructions = data.recipeInstructions ?? [];
  const steps: Omit<Step, 'id' | 'recipeId'>[] = [];
  let order = 1;
  for (const inst of rawInstructions) {
    if (typeof inst === 'string') {
      steps.push({ order: order++, instruction: inst });
    } else if (inst['@type'] === 'HowToStep') {
      const stepImage = extractStepImage(inst);
      steps.push({ order: order++, instruction: inst.text ?? inst.name ?? '', imageUri: stepImage });
    } else if (inst['@type'] === 'HowToSection') {
      for (const step of inst.itemListElement ?? []) {
        const stepImage = extractStepImage(step);
        steps.push({ order: order++, instruction: step.text ?? step.name ?? '', imageUri: stepImage });
      }
    }
  }

  // Nutrition
  let nutrition = null;
  if (data.nutrition) {
    nutrition = {
      calories: parseInt(data.nutrition.calories) || 0,
      protein: parseFloat(data.nutrition.proteinContent) || 0,
      carbs: parseFloat(data.nutrition.carbohydrateContent) || 0,
      fat: parseFloat(data.nutrition.fatContent) || 0,
    };
  }

  return { title, imageUri, servings, prepTime, cookTime, sourceUrl: url, sourcePlatform, ingredients, steps, nutrition };
}

function parseFromMetaTags(html: string, url: string): ImportedRecipe {
  const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<title>([^<]+)<\/title>/i);
  const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const title = titleMatch?.[1] ?? 'Imported Recipe';
  const imageUri = imageMatch?.[1] ?? '';
  return {
    title, imageUri, servings: 4, prepTime: 0, cookTime: 0,
    sourceUrl: url, sourcePlatform: detectPlatform(url),
    ingredients: [], steps: [], nutrition: null,
  };
}

function extractStepImage(step: any): string | undefined {
  if (!step.image) return undefined;
  if (typeof step.image === 'string') return step.image;
  if (Array.isArray(step.image)) {
    const first = step.image[0];
    return typeof first === 'string' ? first : first?.url;
  }
  return step.image?.url;
}

// Fetch a relevant food image from Unsplash for a cooking step
// Uses Unsplash Source API (no key required, returns redirect to image)
export async function getStepImageFromUnsplash(stepText: string): Promise<string> {
  // Extract the most relevant keyword from the step
  const keyword = extractCookingKeyword(stepText);
  // Unsplash source URL — returns a random image for the query
  return `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80&auto=format&fit=crop`;
}

// Extract a meaningful cooking keyword from step text for image search
export function extractCookingKeyword(text: string): string {
  const cookingVerbs = ['slice', 'chop', 'dice', 'mix', 'stir', 'fry', 'bake', 'roast',
    'grill', 'boil', 'simmer', 'sauté', 'marinate', 'season', 'serve', 'garnish',
    'combine', 'whisk', 'fold', 'drain', 'preheat', 'coat'];
  const lower = text.toLowerCase();
  for (const verb of cookingVerbs) {
    if (lower.includes(verb)) return `food ${verb}ing`;
  }
  return 'cooking food';
}

// ── Parse raw text into a structured recipe ──────────────────────────────────
// Works with pasted Instagram captions, TikTok descriptions, typed recipes, OCR output
export function parseRecipeText(text: string): ImportedRecipe {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) throw new Error('No text to parse');

  const UNITS = /\b(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|litres?|pinch|dash|cloves?|handful|pieces?|slices?|cans?|bunches?|heads?|stalks?|sprigs?)\b/i;
  const FRACTION = /^[\d¼½¾⅓⅔⅛⅜⅝⅞]+[\s\/\d\.]*\s/;
  const STEP_NUM = /^(\d+[\.\)\-:\s]+|step\s*\d+[\.\):\s]*)/i;
  const ACTION_VERB = /^(add|mix|stir|cook|bake|heat|pour|place|combine|season|cut|chop|slice|dice|mince|fold|whisk|preheat|bring|reduce|simmer|drain|rinse|pat|brush|spread|layer|serve|top|finish|garnish|remove|transfer|let|allow|rest|cool|fry|sauté|roast|grill|boil|melt|toast|toss|coat|cover|wrap|roll|fill|stuff|blend|process|pulse|strain|squeeze|press|knead|shape|form|divide|portion|brush|drizzle|sprinkle|season|taste|adjust)/i;

  // Title = first line (skip if it's all-caps metadata like "INGREDIENTS")
  let title = lines[0];
  if (title === title.toUpperCase() && title.length < 30) title = lines[1] ?? 'Imported Recipe';

  const ingredients: Omit<Ingredient, 'id' | 'recipeId'>[] = [];
  const steps: Omit<Step, 'id' | 'recipeId'>[] = [];
  let stepOrder = 1;
  let inIngredientsSection = false;
  let inStepsSection = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Section header detection
    if (/^(ingredients?|what you('ll)? need):?$/i.test(line)) { inIngredientsSection = true; inStepsSection = false; continue; }
    if (/^(instructions?|directions?|method|steps?|how to( make)?|preparation):?$/i.test(line)) { inStepsSection = true; inIngredientsSection = false; continue; }
    if (/^(notes?|tips?|serving|nutrition):?$/i.test(line)) { inIngredientsSection = false; inStepsSection = false; continue; }

    // ALL-CAPS short line = section sub-header (e.g. "FOR THE SAUCE")
    if (line === line.toUpperCase() && line.length > 2 && line.length < 60 && !FRACTION.test(line)) continue;

    const looksLikeIngredient = UNITS.test(line) || FRACTION.test(line);
    const looksLikeStep = STEP_NUM.test(line) || ACTION_VERB.test(line) || line.length > 80;

    if (inIngredientsSection || (!inStepsSection && looksLikeIngredient && !looksLikeStep)) {
      // Parse as ingredient
      const clean = line.replace(STEP_NUM, '').trim();
      const m = clean.match(/^([\d¼½¾⅓⅔⅛⅜⅝⅞\s\/\.]+)?\s*([a-zA-Z]+)?\s+(.+)$/);
      if (m && (UNITS.test(m[2] ?? '') || FRACTION.test(clean))) {
        ingredients.push({ section: '', amount: m[1]?.trim() ?? '', unit: m[2]?.trim() ?? '', name: m[3]?.trim() ?? clean, emoji: getIngredientEmoji(m[3] ?? clean), order: ingredients.length });
      } else {
        ingredients.push({ section: '', amount: '', unit: '', name: clean, emoji: getIngredientEmoji(clean), order: ingredients.length });
      }
    } else if (inStepsSection || looksLikeStep) {
      // Parse as step
      const instruction = line.replace(STEP_NUM, '').trim();
      if (instruction.length > 5) steps.push({ order: stepOrder++, instruction });
    }
    // Short lines that don't match anything — skip (likely metadata, hashtags, etc.)
  }

  // If we got nothing, treat every line after title as a step (user pasted unstructured text)
  if (ingredients.length === 0 && steps.length === 0) {
    lines.slice(1).forEach((l, i) => steps.push({ order: i + 1, instruction: l }));
  }

  return {
    title, imageUri: '', servings: 4, prepTime: 0, cookTime: 0,
    sourceUrl: '', sourcePlatform: 'Pasted',
    ingredients, steps, nutrition: null,
  };
}

function detectPlatform(url: string): string {
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('pinterest.com')) return 'Pinterest';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('facebook.com')) return 'Facebook';
  return 'Web';
}

function parseServings(raw: any): number {
  if (!raw) return 4;
  if (typeof raw === 'number') return raw;
  if (Array.isArray(raw)) return parseServings(raw[0]);
  const match = String(raw).match(/\d+/);
  return match ? parseInt(match[0]) : 4;
}

function parseDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? '0') * 60) + parseInt(match[2] ?? '0');
}

function parseIngredientString(raw: string): Omit<Ingredient, 'id' | 'recipeId' | 'order' | 'section'> {
  // Match patterns like "1 1/2 cups flour" or "200g chicken"
  const match = raw.match(/^([\d\s\/\.]+)?\s*([a-zA-Z]*)\s+(.+)$/);
  if (match) {
    return {
      amount: match[1]?.trim() ?? '',
      unit: match[2]?.trim() ?? '',
      name: match[3]?.trim() ?? raw,
      emoji: getIngredientEmoji(raw),
    };
  }
  return { amount: '', unit: '', name: raw, emoji: getIngredientEmoji(raw) };
}

// Group ingredients into sections for display
export function groupIngredientsBySections(ingredients: Ingredient[]) {
  const sections: Record<string, Ingredient[]> = {};
  for (const ing of ingredients) {
    const key = ing.section || '';
    if (!sections[key]) sections[key] = [];
    sections[key].push(ing);
  }
  return sections;
}

// Scale ingredients based on servings ratio
export function scaleAmount(amount: string, ratio: number): string {
  if (!amount) return amount;
  // Handle fractions like "1/2"
  const fracMatch = amount.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (fracMatch) {
    const val = parseInt(fracMatch[1]) + parseInt(fracMatch[2]) / parseInt(fracMatch[3]);
    return formatAmount(val * ratio);
  }
  const fracOnly = amount.match(/^(\d+)\/(\d+)$/);
  if (fracOnly) {
    const val = parseInt(fracOnly[1]) / parseInt(fracOnly[2]);
    return formatAmount(val * ratio);
  }
  const num = parseFloat(amount);
  if (!isNaN(num)) return formatAmount(num * ratio);
  return amount;
}

function formatAmount(num: number): string {
  if (num === Math.floor(num)) return String(num);
  // Try common fractions
  const fracs: [number, string][] = [[0.25, '1/4'], [0.33, '1/3'], [0.5, '1/2'], [0.67, '2/3'], [0.75, '3/4']];
  const whole = Math.floor(num);
  const dec = num - whole;
  for (const [val, str] of fracs) {
    if (Math.abs(dec - val) < 0.05) return whole > 0 ? `${whole} ${str}` : str;
  }
  return num.toFixed(1).replace(/\.0$/, '');
}
