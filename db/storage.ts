import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cookbook, Recipe, Ingredient, Step, GroceryList, GroceryItem, MealPlanEntry, UserProfile } from './schema';

// We use AsyncStorage as a simple JSON store (no native SQLite dependency issues)
// Keys
const KEYS = {
  USER_PROFILE: 'user_profile',
  COOKBOOKS: 'cookbooks',
  RECIPES: 'recipes',
  INGREDIENTS: 'ingredients',
  STEPS: 'steps',
  GROCERY_LISTS: 'grocery_lists',
  GROCERY_ITEMS: 'grocery_items',
  MEAL_PLAN: 'meal_plan',
  ONBOARDING_DONE: 'onboarding_done',
  SUBSCRIPTION: 'subscription',
};

async function getAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

// Cookbooks
export async function getCookbooks(): Promise<Cookbook[]> {
  return getAll<Cookbook>(KEYS.COOKBOOKS);
}

export async function saveCookbook(cookbook: Cookbook): Promise<void> {
  const all = await getCookbooks();
  const idx = all.findIndex(c => c.id === cookbook.id);
  if (idx >= 0) all[idx] = cookbook; else all.push(cookbook);
  await setAll(KEYS.COOKBOOKS, all);
}

export async function deleteCookbook(id: string): Promise<void> {
  const all = await getCookbooks();
  await setAll(KEYS.COOKBOOKS, all.filter(c => c.id !== id));
}

// Recipes
export async function getRecipes(): Promise<Recipe[]> {
  return getAll<Recipe>(KEYS.RECIPES);
}

export async function getRecipesByCookbook(cookbookId: string): Promise<Recipe[]> {
  const all = await getRecipes();
  return all.filter(r => r.cookbookId === cookbookId);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const all = await getRecipes();
  return all.find(r => r.id === id) ?? null;
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const all = await getRecipes();
  const idx = all.findIndex(r => r.id === recipe.id);
  if (idx >= 0) all[idx] = recipe; else all.push(recipe);
  await setAll(KEYS.RECIPES, all);
  // Update cookbook cover images
  await updateCookbookCovers(recipe.cookbookId);
}

export async function deleteRecipe(id: string): Promise<void> {
  const all = await getRecipes();
  const recipe = all.find(r => r.id === id);
  await setAll(KEYS.RECIPES, all.filter(r => r.id !== id));
  if (recipe) await updateCookbookCovers(recipe.cookbookId);
}

async function updateCookbookCovers(cookbookId: string): Promise<void> {
  const recipes = await getRecipesByCookbook(cookbookId);
  const cookbooks = await getCookbooks();
  const idx = cookbooks.findIndex(c => c.id === cookbookId);
  if (idx >= 0) {
    cookbooks[idx].coverImages = recipes
      .filter(r => r.imageUri)
      .slice(0, 4)
      .map(r => r.imageUri);
    await setAll(KEYS.COOKBOOKS, cookbooks);
  }
}

// Ingredients
export async function getIngredientsByRecipe(recipeId: string): Promise<Ingredient[]> {
  const all = await getAll<Ingredient>(KEYS.INGREDIENTS);
  return all.filter(i => i.recipeId === recipeId).sort((a, b) => a.order - b.order);
}

export async function saveIngredients(recipeId: string, ingredients: Ingredient[]): Promise<void> {
  const all = await getAll<Ingredient>(KEYS.INGREDIENTS);
  const filtered = all.filter(i => i.recipeId !== recipeId);
  await setAll(KEYS.INGREDIENTS, [...filtered, ...ingredients]);
}

// Steps
export async function getStepsByRecipe(recipeId: string): Promise<Step[]> {
  const all = await getAll<Step>(KEYS.STEPS);
  return all.filter(s => s.recipeId === recipeId).sort((a, b) => a.order - b.order);
}

export async function saveSteps(recipeId: string, steps: Step[]): Promise<void> {
  const all = await getAll<Step>(KEYS.STEPS);
  const filtered = all.filter(s => s.recipeId !== recipeId);
  await setAll(KEYS.STEPS, [...filtered, ...steps]);
}

// Grocery Lists
export async function getGroceryLists(): Promise<GroceryList[]> {
  return getAll<GroceryList>(KEYS.GROCERY_LISTS);
}

export async function getActiveGroceryList(): Promise<GroceryList | null> {
  const all = await getGroceryLists();
  return all[0] ?? null;
}

export async function saveGroceryList(list: GroceryList): Promise<void> {
  const all = await getGroceryLists();
  const idx = all.findIndex(l => l.id === list.id);
  if (idx >= 0) all[idx] = list; else all.unshift(list);
  await setAll(KEYS.GROCERY_LISTS, all);
}

// Grocery Items
export async function getGroceryItems(listId: string): Promise<GroceryItem[]> {
  const all = await getAll<GroceryItem>(KEYS.GROCERY_ITEMS);
  return all.filter(i => i.listId === listId).sort((a, b) => a.order - b.order);
}

export async function saveGroceryItem(item: GroceryItem): Promise<void> {
  const all = await getAll<GroceryItem>(KEYS.GROCERY_ITEMS);
  const idx = all.findIndex(i => i.id === item.id);
  if (idx >= 0) all[idx] = item; else all.push(item);
  await setAll(KEYS.GROCERY_ITEMS, all);
}

export async function saveGroceryItems(items: GroceryItem[]): Promise<void> {
  const all = await getAll<GroceryItem>(KEYS.GROCERY_ITEMS);
  for (const item of items) {
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
  }
  await setAll(KEYS.GROCERY_ITEMS, all);
}

export async function deleteGroceryItem(id: string): Promise<void> {
  const all = await getAll<GroceryItem>(KEYS.GROCERY_ITEMS);
  await setAll(KEYS.GROCERY_ITEMS, all.filter(i => i.id !== id));
}

export async function toggleGroceryItem(id: string): Promise<void> {
  const all = await getAll<GroceryItem>(KEYS.GROCERY_ITEMS);
  const idx = all.findIndex(i => i.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], checked: !all[idx].checked };
    await setAll(KEYS.GROCERY_ITEMS, all);
  }
}

// Meal Plan
export async function getMealPlanEntries(): Promise<MealPlanEntry[]> {
  return getAll<MealPlanEntry>(KEYS.MEAL_PLAN);
}

export async function getMealPlanForWeek(startDate: string, endDate: string): Promise<MealPlanEntry[]> {
  const all = await getMealPlanEntries();
  return all.filter(e => e.date >= startDate && e.date <= endDate);
}

export async function saveMealPlanEntry(entry: MealPlanEntry): Promise<void> {
  const all = await getMealPlanEntries();
  const idx = all.findIndex(e => e.id === entry.id);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  await setAll(KEYS.MEAL_PLAN, all);
}

export async function deleteMealPlanEntry(id: string): Promise<void> {
  const all = await getMealPlanEntries();
  await setAll(KEYS.MEAL_PLAN, all.filter(e => e.id !== id));
}

// Subscription
export interface SubscriptionData {
  tier: 'free' | 'monthly' | 'annual';
  importsUsed: number;
  previewsUsed: number;
  usageMonth: string; // "YYYY-MM"
}

const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  tier: 'free', importsUsed: 0, previewsUsed: 0, usageMonth: '',
};

export async function getSubscription(): Promise<SubscriptionData> {
  const raw = await AsyncStorage.getItem(KEYS.SUBSCRIPTION);
  return raw ? { ...DEFAULT_SUBSCRIPTION, ...JSON.parse(raw) } : DEFAULT_SUBSCRIPTION;
}

export async function saveSubscription(data: SubscriptionData): Promise<void> {
  await AsyncStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(data));
}
