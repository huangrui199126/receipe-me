/**
 * Paginated trending recipe API backed by GitHub Pages static files.
 *
 * Architecture:
 *   meta.json          — lightweight metadata: version, totalPages, totalRecipes
 *   pages/page_N.json  — 100 index entries per page (~32 KB each)
 *   recipes/{id}/recipe.json — full recipe detail (fetched on demand)
 *
 * First load: fetch meta + page 1 → ~32 KB → cards in <200 ms.
 * Infinite scroll: fetch next page as user nears bottom → seamless.
 * Auto-update: meta.json version changes → stale page caches cleared.
 * Offline: falls back to bundled TRENDING_RECIPES (first ~10 items).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRENDING_RECIPES, TrendingRecipe } from './trendingRecipes';

const BASE_URL = 'https://huangrui199126.github.io/receipe-me/data';
const META_URL = `${BASE_URL}/meta.json`;
const PAGE_URL = (n: number) => `${BASE_URL}/pages/page_${n}.json`;
const META_CACHE_KEY = 'trending_meta_v1';
const PAGE_CACHE_KEY = (n: number) => `trending_page_v1_${n}`;
const DETAIL_CACHE_KEY = (id: string) => `recipe_detail_v1_${id}`;
const META_TTL_MS = 60 * 60 * 1000; // check meta every hour

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

interface Meta {
  version: number;
  totalRecipes: number;
  totalPages: number;
  pageSize: number;
}

interface CachedMeta {
  fetchedAt: number;
  meta: Meta;
}

interface PageResponse {
  page: number;
  totalPages: number;
  recipes: IndexRecipe[];
}

// ── Meta ─────────────────────────────────────────────────────────────────────

async function loadMeta(): Promise<Meta | null> {
  try {
    const res = await fetch(META_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTrendingMeta(): Promise<Meta> {
  // Return cached meta if fresh (checked within last hour)
  try {
    const raw = await AsyncStorage.getItem(META_CACHE_KEY);
    if (raw) {
      const cached: CachedMeta = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < META_TTL_MS) {
        return cached.meta;
      }
      // Stale — re-fetch in background, return cached immediately
      loadMeta().then(async fresh => {
        if (!fresh) return;
        if (fresh.version !== cached.meta.version) {
          // Version changed: wipe all page caches so next fetches get fresh data
          const keys = Array.from({ length: fresh.totalPages }, (_, i) => PAGE_CACHE_KEY(i + 1));
          await AsyncStorage.multiRemove(keys);
        }
        await AsyncStorage.setItem(META_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), meta: fresh }));
      }).catch(() => {});
      return cached.meta;
    }
  } catch {}

  // No cache — fetch synchronously
  const meta = await loadMeta();
  if (meta) {
    await AsyncStorage.setItem(META_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), meta })).catch(() => {});
    return meta;
  }

  // Offline fallback
  return { version: 0, totalRecipes: TRENDING_RECIPES.length, totalPages: 1, pageSize: 100 };
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function fetchTrendingPage(pageNum: number): Promise<IndexRecipe[]> {
  const cacheKey = PAGE_CACHE_KEY(pageNum);

  // Return cached page immediately
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Fetch from network
  try {
    const res = await fetch(PAGE_URL(pageNum));
    if (res.ok) {
      const data: PageResponse = await res.json();
      AsyncStorage.setItem(cacheKey, JSON.stringify(data.recipes)).catch(() => {});
      return data.recipes;
    }
  } catch {}

  // Offline fallback — only for page 1
  if (pageNum === 1) {
    return TRENDING_RECIPES.map(r => ({
      id: r.id, title: r.title, image: r.image,
      sourcePlatform: r.sourcePlatform, importCount: r.importCount,
      healthScore: r.healthScore, nutrition: r.nutrition, tags: r.tags,
    }));
  }

  return [];
}

// ── Search index (all 2510 entries, loaded once for full-text search) ────────

const SEARCH_INDEX_URL = `${BASE_URL}/search_index.json`;
const SEARCH_CACHE_KEY = 'trending_search_v1';

export async function fetchSearchIndex(): Promise<IndexRecipe[]> {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    const res = await fetch(SEARCH_INDEX_URL);
    if (res.ok) {
      const data: { recipes: IndexRecipe[] } = await res.json();
      AsyncStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(data.recipes)).catch(() => {});
      return data.recipes;
    }
  } catch {}
  return [];
}

// ── Detail (fetched on demand when a recipe card is opened) ──────────────────

export async function fetchRecipeDetail(id: string): Promise<TrendingRecipe | null> {
  const cacheKey = DETAIL_CACHE_KEY(id);
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch {}
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

/** Clear all page caches (call on pull-to-refresh). */
export async function clearTrendingCache(): Promise<void> {
  const meta = await loadMeta();
  const pages = meta ? meta.totalPages : 26;
  const keys = [META_CACHE_KEY, SEARCH_CACHE_KEY, ...Array.from({ length: pages }, (_, i) => PAGE_CACHE_KEY(i + 1))];
  await AsyncStorage.multiRemove(keys).catch(() => {});
}
