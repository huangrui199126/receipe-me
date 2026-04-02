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
  // Fetch with a browser-like user agent to avoid blocks
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

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
