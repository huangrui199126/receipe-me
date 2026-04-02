import { Recipe, UserProfile } from '../db/schema';

/**
 * Returns recipes ranked by relevance to user's goals/preferences.
 * - Health goal → boosts low-cal recipes
 * - New cuisines goal → boosts variety of cuisine tags
 * - Cooking skills goal → boosts complex recipes (many steps)
 */
export function getRecommendedRecipes(recipes: Recipe[], profile: UserProfile | null): Recipe[] {
  if (!profile || recipes.length === 0) return recipes;

  const scored = recipes.map(recipe => {
    let score = 0;

    if (profile.goals.includes('healthy')) {
      const cal = recipe.nutrition?.calories ?? 999;
      if (cal < 300) score += 3;
      else if (cal < 500) score += 1;
    }

    if (profile.goals.includes('cuisine')) {
      score += (recipe.tags?.length ?? 0);
    }

    if (profile.goals.includes('cooking')) {
      // Recipes with source URL are typically more detailed
      if (recipe.sourceUrl) score += 1;
    }

    // Newer recipes get a slight boost
    const daysSince = (Date.now() - new Date(recipe.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score += 2;
    else if (daysSince < 30) score += 1;

    return { recipe, score };
  });

  return scored.sort((a, b) => b.score - a.score).map(s => s.recipe);
}
