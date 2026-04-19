import { create } from 'zustand';
import { Cookbook, Recipe, Ingredient, Step, GroceryList, GroceryItem, MealPlanEntry, UserProfile } from '../db/schema';
import * as Storage from '../db/storage';
import { SubscriptionData } from '../db/storage';
import { currentMonthKey, FREE_LIMITS, isPro, SubscriptionTier } from '../lib/subscription';

interface AppState {
  // Auth/Profile
  userProfile: UserProfile | null;
  onboardingDone: boolean;

  // Subscription
  subscription: SubscriptionData;
  setTier: (tier: SubscriptionTier) => Promise<void>;
  canPreviewRecipe: () => boolean;
  consumePreview: () => Promise<void>;
  canImportUrl: () => boolean;
  consumeImport: () => Promise<void>;

  // Cookbooks
  cookbooks: Cookbook[];
  recipes: Recipe[];

  // Grocery
  activeGroceryList: GroceryList | null;
  groceryItems: GroceryItem[];

  // Meal Plan
  mealPlanEntries: MealPlanEntry[];

  // Actions
  loadInitial: () => Promise<void>;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  loadCookbooks: () => Promise<void>;
  addCookbook: (cookbook: Cookbook) => Promise<void>;
  deleteCookbook: (id: string) => Promise<void>;

  loadRecipes: () => Promise<void>;
  saveRecipe: (recipe: Recipe, ingredients: Ingredient[], steps: Step[]) => Promise<void>;
  updateRecipe: (id: string, patch: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;

  loadGroceryList: () => Promise<void>;
  addToGroceryList: (items: GroceryItem[], recipeId?: string) => Promise<void>;
  toggleGroceryItem: (id: string) => Promise<void>;
  deleteGroceryItem: (id: string) => Promise<void>;

  loadMealPlan: () => Promise<void>;
  saveMealPlanEntry: (entry: MealPlanEntry) => Promise<void>;
  deleteMealPlanEntry: (id: string) => Promise<void>;
  addMealPlanToGroceries: (entries: MealPlanEntry[]) => Promise<void>;
}

function resetUsageIfNewMonth(sub: SubscriptionData): SubscriptionData {
  const month = currentMonthKey();
  if (sub.usageMonth !== month) {
    return { ...sub, importsUsed: 0, previewsUsed: 0, usageMonth: month };
  }
  return sub;
}

export const useStore = create<AppState>((set, get) => ({
  userProfile: null,
  onboardingDone: false,
  cookbooks: [],
  recipes: [],
  activeGroceryList: null,
  groceryItems: [],
  mealPlanEntries: [],
  subscription: { tier: 'free', importsUsed: 0, previewsUsed: 0, usageMonth: '' },

  setTier: async (tier) => {
    const sub = resetUsageIfNewMonth({ ...get().subscription, tier });
    await Storage.saveSubscription(sub);
    set({ subscription: sub });
  },

  canPreviewRecipe: () => {
    const sub = resetUsageIfNewMonth(get().subscription);
    if (isPro(sub.tier)) return true;
    return sub.previewsUsed < FREE_LIMITS.previewsPerMonth;
  },

  consumePreview: async () => {
    const sub = resetUsageIfNewMonth(get().subscription);
    if (isPro(sub.tier)) return;
    const updated = { ...sub, previewsUsed: sub.previewsUsed + 1 };
    await Storage.saveSubscription(updated);
    set({ subscription: updated });
  },

  canImportUrl: () => {
    const sub = resetUsageIfNewMonth(get().subscription);
    if (isPro(sub.tier)) return true;
    return sub.importsUsed < FREE_LIMITS.importsPerMonth;
  },

  consumeImport: async () => {
    const sub = resetUsageIfNewMonth(get().subscription);
    if (isPro(sub.tier)) return;
    const updated = { ...sub, importsUsed: sub.importsUsed + 1 };
    await Storage.saveSubscription(updated);
    set({ subscription: updated });
  },

  loadInitial: async () => {
    const [profile, done, cookbooks, recipes, groceryList, rawSub] = await Promise.all([
      Storage.getUserProfile(),
      Storage.isOnboardingDone(),
      Storage.getCookbooks(),
      Storage.getRecipes(),
      Storage.getActiveGroceryList(),
      Storage.getSubscription(),
    ]);
    const subscription = resetUsageIfNewMonth(rawSub);
    let groceryItems: GroceryItem[] = [];
    if (groceryList) {
      groceryItems = await Storage.getGroceryItems(groceryList.id);
    }
    const mealPlanEntries = await Storage.getMealPlanEntries();
    set({ userProfile: profile, onboardingDone: done, cookbooks, recipes, activeGroceryList: groceryList, groceryItems, mealPlanEntries, subscription });
  },

  saveUserProfile: async (profile) => {
    await Storage.saveUserProfile(profile);
    set({ userProfile: profile });
  },

  completeOnboarding: async () => {
    await Storage.setOnboardingDone();
    set({ onboardingDone: true });
  },

  loadCookbooks: async () => {
    const cookbooks = await Storage.getCookbooks();
    set({ cookbooks });
  },

  addCookbook: async (cookbook) => {
    await Storage.saveCookbook(cookbook);
    const cookbooks = await Storage.getCookbooks();
    set({ cookbooks });
  },

  deleteCookbook: async (id) => {
    await Storage.deleteCookbook(id);
    const cookbooks = await Storage.getCookbooks();
    set({ cookbooks });
  },

  loadRecipes: async () => {
    const recipes = await Storage.getRecipes();
    set({ recipes });
  },

  saveRecipe: async (recipe, ingredients, steps) => {
    await Storage.saveRecipe(recipe);
    await Storage.saveIngredients(recipe.id, ingredients);
    await Storage.saveSteps(recipe.id, steps);
    const [recipes, cookbooks] = await Promise.all([Storage.getRecipes(), Storage.getCookbooks()]);
    set({ recipes, cookbooks });
  },

  updateRecipe: async (id, patch) => {
    const recipe = get().recipes.find(r => r.id === id);
    if (!recipe) return;
    const updated = { ...recipe, ...patch };
    await Storage.saveRecipe(updated);
    const recipes = await Storage.getRecipes();
    set({ recipes });
  },

  deleteRecipe: async (id) => {
    await Storage.deleteRecipe(id);
    const [recipes, cookbooks] = await Promise.all([Storage.getRecipes(), Storage.getCookbooks()]);
    set({ recipes, cookbooks });
  },

  loadGroceryList: async () => {
    const list = await Storage.getActiveGroceryList();
    if (list) {
      const items = await Storage.getGroceryItems(list.id);
      set({ activeGroceryList: list, groceryItems: items });
    }
  },

  addToGroceryList: async (newItems, recipeId) => {
    let list = get().activeGroceryList;
    if (!list) {
      list = { id: `list_${Date.now()}`, name: 'Grocery List', recipeIds: [], createdAt: new Date().toISOString() };
      await Storage.saveGroceryList(list);
    }
    if (recipeId && !list.recipeIds.includes(recipeId)) {
      list = { ...list, recipeIds: [...list.recipeIds, recipeId] };
      await Storage.saveGroceryList(list);
    }
    const items = newItems.map(i => ({ ...i, listId: list!.id }));
    await Storage.saveGroceryItems(items);
    const updatedItems = await Storage.getGroceryItems(list.id);
    set({ activeGroceryList: list, groceryItems: updatedItems });
  },

  toggleGroceryItem: async (id) => {
    await Storage.toggleGroceryItem(id);
    const list = get().activeGroceryList;
    if (list) {
      const items = await Storage.getGroceryItems(list.id);
      set({ groceryItems: items });
    }
  },

  deleteGroceryItem: async (id) => {
    await Storage.deleteGroceryItem(id);
    const list = get().activeGroceryList;
    if (list) {
      const items = await Storage.getGroceryItems(list.id);
      set({ groceryItems: items });
    }
  },

  loadMealPlan: async () => {
    const entries = await Storage.getMealPlanEntries();
    set({ mealPlanEntries: entries });
  },

  saveMealPlanEntry: async (entry) => {
    await Storage.saveMealPlanEntry(entry);
    const entries = await Storage.getMealPlanEntries();
    set({ mealPlanEntries: entries });
  },

  deleteMealPlanEntry: async (id) => {
    await Storage.deleteMealPlanEntry(id);
    const entries = await Storage.getMealPlanEntries();
    set({ mealPlanEntries: entries });
  },

  addMealPlanToGroceries: async (entries) => {
    const { recipes } = get();
    const allIngredients: Ingredient[] = [];
    for (const entry of entries) {
      const recipe = recipes.find(r => r.id === entry.recipeId);
      if (recipe) {
        const ings = await Storage.getIngredientsByRecipe(recipe.id);
        allIngredients.push(...ings);
      }
    }
    const groceryItems: GroceryItem[] = allIngredients.map((ing, i) => ({
      id: `gi_${Date.now()}_${i}`,
      listId: '',
      recipeId: ing.recipeId,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: categorizeIngredient(ing.name),
      emoji: ing.emoji,
      checked: false,
      order: i,
    }));
    await get().addToGroceryList(groceryItems);
  },
}));

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  const produce = ['lettuce', 'tomato', 'onion', 'spinach', 'broccoli', 'carrot', 'celery', 'garlic', 'ginger', 'avocado', 'lemon', 'lime', 'pepper', 'zucchini', 'mushroom', 'herb', 'parsley', 'basil', 'cilantro', 'corn', 'scallion'];
  const meat = ['chicken', 'beef', 'pork', 'bacon', 'salmon', 'shrimp', 'turkey', 'sausage', 'lamb', 'tuna', 'fish', 'seafood', 'pancetta', 'rib'];
  const dairy = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'parmesan', 'mozzarella', 'egg'];
  const bakery = ['bread', 'flour', 'baguette', 'wrap', 'tortilla', 'bun'];
  if (produce.some(p => lower.includes(p))) return 'FRESH PRODUCE';
  if (meat.some(m => lower.includes(m))) return 'MEAT & SEAFOOD';
  if (dairy.some(d => lower.includes(d))) return 'DAIRY';
  if (bakery.some(b => lower.includes(b))) return 'BAKERY';
  return 'PANTRY';
}
