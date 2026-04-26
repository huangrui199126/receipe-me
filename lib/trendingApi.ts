/**
 * Fetches trending recipes from GitHub Pages.
 *
 * On first load (no cache): fetches index.json then all recipe.json files in
 * batches and caches the full data locally. Subsequent loads within the TTL
 * return instantly from cache.
 *
 * Auto-update: on each startup the cached version is compared against the
 * server's index.json version. If newer, the cache is refreshed immediately.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRENDING_RECIPES, TrendingRecipe } from './trendingRecipes';

const BASE_URL = 'https://huangrui199126.github.io/receipe-me/data';
const INDEX_URL = `${BASE_URL}/index.json`;
const CACHE_KEY = 'trending_recipes_cache_v5'; // v5: full recipe data + version check
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 20; // fetch recipe.json files 20 at a time

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
}

interface CachedData {
  fetchedAt: number;
  version: number;
  recipes: TrendingRecipe[];
}

async function fetchRecipe(id: string): Promise<TrendingRecipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/recipes/${id}/recipe.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAllRecipes(ids: string[]): Promise<TrendingRecipe[]> {
  const results: TrendingRecipe[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const fetched = await Promise.all(batch.map(id => fetchRecipe(id)));
    for (const r of fetched) {
      if (r) results.push(r);
    }
  }
  return results;
}

export async function fetchTrendingRecipes(): Promise<TrendingRecipe[]> {
  // 1. Load cached data
  let cached: CachedData | null = null;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const now = Date.now();

  // 2. Cache is fresh — check server version in background, return cached immediately
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    refreshIfNewVersion(cached.version).catch(() => {});
    return cached.recipes;
  }

  // 3. Cache stale or absent — fetch fresh data
  try {
    const indexRes = await fetch(INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (indexRes.ok) {
      const index: IndexResponse = await indexRes.json();
      const ids = index.recipes.map(r => r.id);
      const recipes = await fetchAllRecipes(ids);

      if (recipes.length > 0) {
        const toCache: CachedData = { fetchedAt: now, version: index.version, recipes };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        return recipes;
      }
    }
  } catch {}

  // 4. Offline fallback
  return cached?.recipes ?? TRENDING_RECIPES;
}

/** Silently refreshes cache if server has a newer version. */
async function refreshIfNewVersion(cachedVersion: number) {
  const indexRes = await fetch(INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
  if (!indexRes.ok) return;
  const index: IndexResponse = await indexRes.json();
  if (index.version <= cachedVersion) return;

  const ids = index.recipes.map(r => r.id);
  const recipes = await fetchAllRecipes(ids);
  if (recipes.length > 0) {
    const toCache: CachedData = { fetchedAt: Date.now(), version: index.version, recipes };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
  }
}

/** Force refresh (call on pull-to-refresh). */
export async function refreshTrendingRecipes(): Promise<TrendingRecipe[]> {
  await AsyncStorage.removeItem(CACHE_KEY);
  return fetchTrendingRecipes();
}
