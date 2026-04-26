/**
 * Fetches trending recipes from GitHub Pages.
 *
 * Performance architecture:
 *   - List view: fetches ONLY index.json (~500KB for all entries with metadata)
 *     instead of firing N parallel requests for every recipe.json
 *   - Detail view: fetchRecipeDetail(id) loads a single recipe.json on demand
 *     when the user opens a recipe in the preview sheet
 *
 * Auto-update: on each startup we compare the cached version against the server
 * version in index.json. If the server has a newer version the cache is refreshed
 * in the background so the next screen visit shows fresh data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRENDING_RECIPES, TrendingRecipe } from './trendingRecipes';

const BASE_URL = 'https://huangrui199126.github.io/receipe-me/data';
const INDEX_URL = `${BASE_URL}/index.json`;
const CACHE_KEY = 'trending_index_v4'; // bumped: old v3 cached per-recipe, v4 caches index only
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

interface CachedIndex {
  fetchedAt: number;
  version: number;
  recipes: TrendingRecipe[];
}

function indexEntryToRecipe(e: IndexEntry): TrendingRecipe {
  return {
    id: e.id,
    title: e.title,
    image: e.image,
    importCount: e.importCount,
    sourcePlatform: e.sourcePlatform,
    healthScore: e.healthScore,
    nutrition: e.nutrition,
    tags: e.tags,
    servings: 0,
    prepTime: 0,
    cookTime: 0,
    ingredients: [],
    steps: [],
  };
}

async function loadIndex(): Promise<{ index: IndexResponse; recipes: TrendingRecipe[] } | null> {
  try {
    const res = await fetch(INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return null;
    const index: IndexResponse = await res.json();
    return { index, recipes: index.recipes.map(indexEntryToRecipe) };
  } catch {
    return null;
  }
}

/** Background version check — refreshes cache silently if server version is newer. */
async function checkVersionInBackground(cachedVersion: number) {
  const result = await loadIndex();
  if (!result) return;
  if (result.index.version > cachedVersion) {
    const toCache: CachedIndex = {
      fetchedAt: Date.now(),
      version: result.index.version,
      recipes: result.recipes,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
  }
}

export async function fetchTrendingRecipes(): Promise<TrendingRecipe[]> {
  // 1. Load cached index
  let cached: CachedIndex | null = null;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const now = Date.now();

  // 2. Cache is fresh — return immediately, check for updates in background
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    checkVersionInBackground(cached.version);
    return cached.recipes;
  }

  // 3. Cache is stale or absent — fetch index.json (single request)
  const result = await loadIndex();
  if (result) {
    const toCache: CachedIndex = {
      fetchedAt: now,
      version: result.index.version,
      recipes: result.recipes,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
    return result.recipes;
  }

  // 4. Offline fallback
  return cached?.recipes ?? TRENDING_RECIPES;
}

/** Fetch full recipe data (ingredients + steps) on demand when a recipe is opened. */
export async function fetchRecipeDetail(id: string): Promise<TrendingRecipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/recipes/${id}/recipe.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Force refresh (call on pull-to-refresh). */
export async function refreshTrendingRecipes(): Promise<TrendingRecipe[]> {
  await AsyncStorage.removeItem(CACHE_KEY);
  return fetchTrendingRecipes();
}
