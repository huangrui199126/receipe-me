/**
 * Trending recipes — paginated index + on-demand detail.
 *
 * First load: one request to index.json → cards appear instantly.
 * Pagination: the caller slices the cached index as user scrolls.
 * Detail: individual recipe.json fetched + cached when a card is opened.
 * Auto-update: background version check refreshes index cache silently.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRENDING_RECIPES, TrendingRecipe } from './trendingRecipes';

const BASE_URL = 'https://huangrui199126.github.io/receipe-me/data';
const INDEX_URL = `${BASE_URL}/index.json`;
const INDEX_CACHE_KEY = 'trending_index_v6';
const DETAIL_CACHE_PREFIX = 'recipe_detail_v1_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface IndexRecipe {
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
  recipes: IndexRecipe[];
}

interface CachedIndex {
  fetchedAt: number;
  version: number;
  recipes: IndexRecipe[];
}

// ── Index (list view) ────────────────────────────────────────────────────────

export async function fetchTrendingIndex(): Promise<IndexRecipe[]> {
  // 1. Return cached if fresh
  let cached: CachedIndex | null = null;
  try {
    const raw = await AsyncStorage.getItem(INDEX_CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    checkVersionInBackground(cached.version);
    return cached.recipes;
  }

  // 2. Fetch index.json
  try {
    const res = await fetch(INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const index: IndexResponse = await res.json();
      const toCache: CachedIndex = { fetchedAt: now, version: index.version, recipes: index.recipes };
      await AsyncStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(toCache));
      return index.recipes;
    }
  } catch {}

  // 3. Offline fallback — bundled recipes as index entries
  if (cached) return cached.recipes;
  return TRENDING_RECIPES.map(r => ({
    id: r.id, title: r.title, image: r.image,
    sourcePlatform: r.sourcePlatform, importCount: r.importCount,
    healthScore: r.healthScore, nutrition: r.nutrition, tags: r.tags,
  }));
}

async function checkVersionInBackground(cachedVersion: number) {
  try {
    const res = await fetch(INDEX_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return;
    const index: IndexResponse = await res.json();
    if (index.version > cachedVersion) {
      const toCache: CachedIndex = { fetchedAt: Date.now(), version: index.version, recipes: index.recipes };
      await AsyncStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(toCache));
    }
  } catch {}
}

// ── Detail (recipe modal) ────────────────────────────────────────────────────

export async function fetchRecipeDetail(id: string): Promise<TrendingRecipe | null> {
  const cacheKey = `${DETAIL_CACHE_PREFIX}${id}`;

  // 1. Return cached detail immediately
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch {}

  // 2. Fetch from network
  try {
    const res = await fetch(`${BASE_URL}/recipes/${id}/recipe.json`);
    if (!res.ok) return null;
    const detail: TrendingRecipe = await res.json();
    AsyncStorage.setItem(cacheKey, JSON.stringify(detail)).catch(() => {});
    return detail;
  } catch {
    return null;
  }
}

/** Force refresh the index (call on pull-to-refresh). */
export async function refreshTrendingIndex(): Promise<IndexRecipe[]> {
  await AsyncStorage.removeItem(INDEX_CACHE_KEY);
  return fetchTrendingIndex();
}
