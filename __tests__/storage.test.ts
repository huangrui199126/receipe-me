import * as Storage from '../db/storage';
import { Cookbook, Recipe, Ingredient, Step } from '../db/schema';

const mockCookbook: Cookbook = {
  id: 'cb_1', name: 'Dinner', emoji: '🍽',
  coverImages: [], createdAt: '2026-01-01T00:00:00Z',
};

const mockRecipe: Recipe = {
  id: 'r_1', cookbookId: 'cb_1', title: 'Pasta Carbonara',
  imageUri: '', servings: 4, prepTime: 10, cookTime: 20,
  sourceUrl: null, sourcePlatform: null, nutrition: null,
  tags: ['italian'], createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  require('@react-native-async-storage/async-storage').clear();
});

describe('Cookbook storage', () => {
  it('saves and retrieves a cookbook', async () => {
    await Storage.saveCookbook(mockCookbook);
    const all = await Storage.getCookbooks();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Dinner');
  });

  it('updates existing cookbook', async () => {
    await Storage.saveCookbook(mockCookbook);
    await Storage.saveCookbook({ ...mockCookbook, name: 'Weeknight Dinners' });
    const all = await Storage.getCookbooks();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Weeknight Dinners');
  });

  it('deletes a cookbook', async () => {
    await Storage.saveCookbook(mockCookbook);
    await Storage.deleteCookbook('cb_1');
    const all = await Storage.getCookbooks();
    expect(all).toHaveLength(0);
  });
});

describe('Recipe storage', () => {
  it('saves and retrieves a recipe', async () => {
    await Storage.saveRecipe(mockRecipe);
    const all = await Storage.getRecipes();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Pasta Carbonara');
  });

  it('retrieves recipe by id', async () => {
    await Storage.saveRecipe(mockRecipe);
    const r = await Storage.getRecipeById('r_1');
    expect(r).not.toBeNull();
    expect(r!.title).toBe('Pasta Carbonara');
  });

  it('returns null for missing recipe', async () => {
    const r = await Storage.getRecipeById('nonexistent');
    expect(r).toBeNull();
  });

  it('filters recipes by cookbook', async () => {
    await Storage.saveRecipe(mockRecipe);
    await Storage.saveRecipe({ ...mockRecipe, id: 'r_2', cookbookId: 'cb_2' });
    const cb1Recipes = await Storage.getRecipesByCookbook('cb_1');
    expect(cb1Recipes).toHaveLength(1);
    expect(cb1Recipes[0].id).toBe('r_1');
  });

  it('deletes a recipe', async () => {
    await Storage.saveRecipe(mockRecipe);
    await Storage.deleteRecipe('r_1');
    const all = await Storage.getRecipes();
    expect(all).toHaveLength(0);
  });
});

describe('Ingredient storage', () => {
  const ingredients: Ingredient[] = [
    { id: 'i_1', recipeId: 'r_1', section: '', name: 'Pasta', amount: '200', unit: 'g', emoji: '🍝', order: 0 },
    { id: 'i_2', recipeId: 'r_1', section: '', name: 'Bacon', amount: '100', unit: 'g', emoji: '🥓', order: 1 },
  ];

  it('saves and retrieves ingredients', async () => {
    await Storage.saveIngredients('r_1', ingredients);
    const result = await Storage.getIngredientsByRecipe('r_1');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Pasta');
  });

  it('replaces ingredients on re-save', async () => {
    await Storage.saveIngredients('r_1', ingredients);
    await Storage.saveIngredients('r_1', [ingredients[0]]);
    const result = await Storage.getIngredientsByRecipe('r_1');
    expect(result).toHaveLength(1);
  });
});

describe('Grocery items', () => {
  it('toggles checked state', async () => {
    const item = {
      id: 'gi_1', listId: 'list_1', recipeId: null,
      name: 'Tomatoes', amount: '2', unit: '', category: 'FRESH PRODUCE',
      emoji: '🍅', checked: false, order: 0,
    };
    await Storage.saveGroceryItems([item]);
    await Storage.toggleGroceryItem('gi_1');
    const items = await Storage.getGroceryItems('list_1');
    expect(items[0].checked).toBe(true);
  });
});

describe('Meal plan', () => {
  it('saves and retrieves meal plan entry', async () => {
    const entry = { id: 'mp_1', date: '2026-04-01', mealType: 'dinner' as const, recipeId: 'r_1' };
    await Storage.saveMealPlanEntry(entry);
    const entries = await Storage.getMealPlanEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].mealType).toBe('dinner');
  });

  it('filters meal plan by week', async () => {
    await Storage.saveMealPlanEntry({ id: 'mp_1', date: '2026-04-01', mealType: 'lunch', recipeId: 'r_1' });
    await Storage.saveMealPlanEntry({ id: 'mp_2', date: '2026-04-10', mealType: 'dinner', recipeId: 'r_1' });
    const week = await Storage.getMealPlanForWeek('2026-03-30', '2026-04-05');
    expect(week).toHaveLength(1);
    expect(week[0].id).toBe('mp_1');
  });

  it('deletes meal plan entry', async () => {
    await Storage.saveMealPlanEntry({ id: 'mp_1', date: '2026-04-01', mealType: 'lunch', recipeId: 'r_1' });
    await Storage.deleteMealPlanEntry('mp_1');
    const entries = await Storage.getMealPlanEntries();
    expect(entries).toHaveLength(0);
  });
});
