/**
 * Fetches trending recipes from GitHub Pages.
 * No app rebuild needed to add new recipes, step images, or update data.
 *
 * Structure:
 *   index.json              → lightweight list (fetched first)
 *   recipes/{id}/recipe.json → full recipe data + self-hosted image URLs
 *
 * All images are hosted on GitHub Pages — no dependency on fal.ai CDN or Unsplash.
 * Results are cached in AsyncStorage for 24 hours.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRENDING_RECIPES, TrendingRecipe } from './trendingRecipes';

const BASE_URL = 'https://huangrui199126.github.io/receipe-me/data';
const INDEX_URL = `${BASE_URL}/index.json`;
const CACHE_KEY = 'trending_recipes_cache_v3'; // v3: all images self-hosted on GitHub Pages
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface IndexEntry {
  id: string;
  title: string;
  image: string;
  sourcePlatform: string;
  importCount: string;
  healthScore: number;
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  tags: string[];
}

interface IndexResponse {
  version: number;
  updatedAt: string;
  recipeCount: number;
  recipes: IndexEntry[];
  recipeBaseUrl: string;
}

interface CachedData {
  fetchedAt: number;
  recipes: TrendingRecipe[];
}

async function fetchRecipe(id: string): Promise<TrendingRecipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/recipes/${id}/recipe.json`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTrendingRecipes(): Promise<TrendingRecipe[]> {
  // 1. Return cached data if fresh
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedData = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.recipes;
      }
    }
  } catch {}

  // 2. Fetch index, then each recipe in parallel
  try {
    const indexRes = await fetch(INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (indexRes.ok) {
      const index: IndexResponse = await indexRes.json();
      const ids = index.recipes.map(r => r.id);

      const fetched = await Promise.all(ids.map(id => fetchRecipe(id)));
      const recipes = fetched.filter((r): r is TrendingRecipe => r !== null);

      if (recipes.length > 0) {
        const toCache: CachedData = { fetchedAt: Date.now(), recipes };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        return recipes;
      }
    }
  } catch {}

  // 3. Offline fallback — bundled data always works
  return TRENDING_RECIPES;
}

/** Force refresh (call on pull-to-refresh) */
export async function refreshTrendingRecipes(): Promise<TrendingRecipe[]> {
  await AsyncStorage.removeItem(CACHE_KEY);
  return fetchTrendingRecipes();
}
