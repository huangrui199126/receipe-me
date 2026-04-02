/**
 * Fetches trending recipes from GitHub Pages.
 * No app rebuild needed to add new recipes, step images, or update data.
 *
 * URL: https://huangrui199126.github.io/receipe-me/data/trending.json
 *
 * Falls back to the bundled trendingRecipes.ts if offline or fetch fails.
 * Results are cached in AsyncStorage for 24 hours.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRENDING_RECIPES, TrendingRecipe } from './trendingRecipes';

const API_URL = 'https://huangrui199126.github.io/receipe-me/data/trending.json';
const CACHE_KEY = 'trending_recipes_cache_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface TrendingApiResponse {
  version: number;
  updatedAt: string;
  recipes: TrendingRecipe[];
}

interface CachedData {
  fetchedAt: number;
  data: TrendingApiResponse;
}

export async function fetchTrendingRecipes(): Promise<TrendingRecipe[]> {
  // 1. Check cache first
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedData = JSON.parse(raw);
      const age = Date.now() - cached.fetchedAt;
      if (age < CACHE_TTL_MS) {
        return cached.data.recipes;
      }
    }
  } catch {}

  // 2. Try fetching from GitHub Pages
  try {
    const response = await fetch(API_URL, {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (response.ok) {
      const data: TrendingApiResponse = await response.json();
      if (data.recipes?.length > 0) {
        // Cache the result
        const toCache: CachedData = { fetchedAt: Date.now(), data };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        return data.recipes;
      }
    }
  } catch {}

  // 3. Fall back to bundled data (always works offline)
  return TRENDING_RECIPES;
}

/** Force refresh the cache (call when user pulls to refresh) */
export async function refreshTrendingRecipes(): Promise<TrendingRecipe[]> {
  await AsyncStorage.removeItem(CACHE_KEY);
  return fetchTrendingRecipes();
}
