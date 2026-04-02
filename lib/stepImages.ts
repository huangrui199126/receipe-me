/**
 * Step image service for cooking mode.
 *
 * Strategy (in order):
 * 1. Use image extracted from the recipe site during import (best quality)
 * 2. Use fal.ai Flux model to generate an AI image (requires FAL_API_KEY)
 * 3. Fall back to curated Unsplash food photos matched by cooking action
 */

// ------------------------------------------------------------------
// FAL.AI SETUP
// To enable AI-generated step images:
//   1. Sign up at https://fal.ai — free credits included
//   2. Get your API key from https://fal.ai/dashboard/keys
//   3. Add it to your app config or environment
// ------------------------------------------------------------------
const FAL_API_KEY = ''; // Set your fal.ai key here

export async function generateStepImage(instruction: string): Promise<string | null> {
  if (!FAL_API_KEY) return null;

  const prompt = buildImagePrompt(instruction);

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square',
        num_inference_steps: 4,
        num_images: 1,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.images?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

function buildImagePrompt(instruction: string): string {
  // Shorten the instruction to a concise visual prompt
  const lower = instruction.toLowerCase();
  const action = detectCookingAction(lower);
  return `Close-up food photography of ${action}, professional kitchen lighting, appetizing, high resolution, no text`;
}

function detectCookingAction(text: string): string {
  if (text.includes('slice') || text.includes('chop') || text.includes('dice'))
    return 'hands chopping fresh vegetables on a wooden cutting board';
  if (text.includes('fry') || text.includes('sauté'))
    return 'sizzling food in a pan with golden crust, steam rising';
  if (text.includes('bake') || text.includes('oven'))
    return 'golden food on a baking tray fresh out of the oven';
  if (text.includes('grill'))
    return 'grilled food with char marks on a hot grill';
  if (text.includes('boil') || text.includes('simmer'))
    return 'pot of simmering sauce or soup with steam';
  if (text.includes('mix') || text.includes('stir') || text.includes('whisk'))
    return 'mixing ingredients in a bowl with a wooden spoon';
  if (text.includes('marinate') || text.includes('season'))
    return 'raw seasoned meat or vegetables in a bowl with herbs and spices';
  if (text.includes('serve') || text.includes('plate'))
    return 'beautifully plated dish on a white plate ready to serve';
  if (text.includes('garnish'))
    return 'finished dish garnished with fresh herbs and lemon';
  if (text.includes('preheat'))
    return 'modern kitchen oven being preheated, glowing element';
  if (text.includes('drain') || text.includes('strain'))
    return 'draining cooked pasta in a colander with steam';
  if (text.includes('rest') || text.includes('cool'))
    return 'cooked meat resting on a cutting board';
  return 'cooking ingredients on a wooden kitchen counter';
}

// ------------------------------------------------------------------
// Curated Unsplash fallback images per cooking action
// All from Unsplash (free to use, no API key needed for direct URLs)
// ------------------------------------------------------------------
const STEP_IMAGE_MAP: Record<string, string> = {
  chop:      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80',
  slice:     'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80',
  dice:      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80',
  fry:       'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&q=80',
  sauté:     'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&q=80',
  stir:      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  mix:       'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  whisk:     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  bake:      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  roast:     'https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=800&q=80',
  grill:     'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80',
  boil:      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
  simmer:    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  marinate:  'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=800&q=80',
  season:    'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=800&q=80',
  serve:     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  plate:     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  garnish:   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  preheat:   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  drain:     'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
  combine:   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  coat:      'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=800&q=80',
  rest:      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  default:   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
};

export function getStepFallbackImage(instruction: string): string {
  const lower = instruction.toLowerCase();
  for (const [keyword, url] of Object.entries(STEP_IMAGE_MAP)) {
    if (keyword !== 'default' && lower.includes(keyword)) return url;
  }
  return STEP_IMAGE_MAP.default;
}

/**
 * Get the best available image for a step:
 * 1. Already has an image (from import) → use it
 * 2. FAL_API_KEY set → generate with AI
 * 3. Fallback → curated Unsplash photo by cooking action
 */
export async function resolveStepImage(instruction: string, existingImageUri?: string): Promise<string> {
  if (existingImageUri) return existingImageUri;
  const generated = await generateStepImage(instruction);
  if (generated) return generated;
  return getStepFallbackImage(instruction);
}
