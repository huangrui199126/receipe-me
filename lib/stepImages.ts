/**
 * Step image generation using fal.ai FLUX.1
 *
 * HOW IT WORKS:
 * 1. Takes the recipe's final dish photo as a visual style reference
 * 2. Uses FLUX.1 + IP-Adapter to generate each step image in the same style
 * 3. Results are cached in AsyncStorage — generated once, reused forever
 * 4. Falls back to the recipe's main photo if generation is unavailable
 *
 * TO ENABLE:
 * 1. Sign up at https://fal.ai (free credits included)
 * 2. Get your key from https://fal.ai/dashboard/keys
 * 3. Paste it below
 *
 * COST: ~$0.003/image with schnell, ~$0.025/image with dev (higher quality)
 * 5 steps = ~$0.015 per recipe with schnell
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIGURE HERE ───────────────────────────────────────────────
const FAL_API_KEY = ''; // e.g. 'fal-abc123...'
const MODEL = 'fal-ai/flux/schnell'; // swap to 'fal-ai/flux/dev' for higher quality
// ──────────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = 'step_images_v1_';

export interface StepImageResult {
  stepId: string;
  imageUri: string;
}

/**
 * Generate images for all steps of a recipe.
 * Returns cached results immediately if already generated.
 * Uses the recipe's final dish photo as a visual reference for consistency.
 */
export async function generateStepImages(
  recipeId: string,
  recipeImageUri: string,
  steps: { id: string; order: number; instruction: string; imageUri?: string }[],
): Promise<StepImageResult[]> {
  // Return cached results if available
  const cacheKey = `${CACHE_KEY_PREFIX}${recipeId}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  // If no API key, return empty (cook mode will show recipe photo)
  if (!FAL_API_KEY) return [];

  const results: StepImageResult[] = [];

  for (const step of steps) {
    // Use the step's own image if it was scraped from the source
    if (step.imageUri) {
      results.push({ stepId: step.id, imageUri: step.imageUri });
      continue;
    }

    try {
      const imageUri = await generateOneStepImage(
        step.instruction,
        recipeImageUri,
        step.order,
        steps.length,
      );
      if (imageUri) results.push({ stepId: step.id, imageUri });
    } catch {
      // Skip failed steps — cook mode falls back to recipe photo
    }
  }

  // Cache the results
  if (results.length > 0) {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(results));
  }

  return results;
}

async function generateOneStepImage(
  instruction: string,
  referenceImageUri: string,
  stepNumber: number,
  totalSteps: number,
): Promise<string | null> {
  const prompt = buildStepPrompt(instruction, stepNumber, totalSteps);

  // Use FLUX IP-Adapter if we have a reference image URL (works with http/https)
  const useIpAdapter = referenceImageUri.startsWith('http');
  const endpoint = useIpAdapter
    ? 'fal-ai/flux-ip-adapter'
    : MODEL;

  const body = useIpAdapter
    ? {
        prompt,
        ip_adapter_image_url: referenceImageUri,
        ip_adapter_scale: 0.4, // 0=ignore reference, 1=copy reference style exactly. 0.4 = subtle consistency
        image_size: 'landscape_4_3',
        num_inference_steps: 8,
        num_images: 1,
      }
    : {
        prompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
        num_images: 1,
      };

  const response = await fetch(`https://fal.run/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data?.images?.[0]?.url ?? null;
}

function buildStepPrompt(instruction: string, step: number, total: number): string {
  const action = extractVisualAction(instruction);
  return (
    `Professional food photography, cooking step ${step} of ${total}: ${action}. ` +
    `Close-up, warm kitchen lighting, shallow depth of field, appetizing, high resolution. ` +
    `No text, no watermarks.`
  );
}

function extractVisualAction(instruction: string): string {
  // Keep the first sentence only (usually the main action)
  const first = instruction.split(/[.!]/)[0].trim();
  // Truncate to ~80 chars for prompt efficiency
  return first.length > 80 ? first.slice(0, 80) + '...' : first;
}

/**
 * Clear cached step images for a recipe (call if recipe is edited)
 */
export async function clearStepImageCache(recipeId: string): Promise<void> {
  await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${recipeId}`);
}
