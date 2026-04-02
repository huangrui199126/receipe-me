export interface UserProfile {
  id: string;
  username: string;
  goals: string[]; // e.g. ['healthy', 'organize']
  recipeSources: string[]; // e.g. ['social', 'websites']
  ageRange: string;
  referralSource: string;
  isPlusMember: boolean;
  trialStartDate: string | null;
  createdAt: string;
}

export interface Cookbook {
  id: string;
  name: string;
  emoji: string;
  coverImages: string[]; // up to 4 image uris for collage
  createdAt: string;
}

export interface Ingredient {
  id: string;
  recipeId: string;
  section: string; // e.g. 'CHICKEN', 'SOY GLAZE SAUCE', or '' for no section
  name: string;
  amount: string;
  unit: string;
  emoji: string;
  order: number;
}

export interface Step {
  id: string;
  recipeId: string;
  order: number;
  instruction: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  cookbookId: string;
  title: string;
  imageUri: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  sourceUrl: string | null;
  sourcePlatform: string | null; // 'instagram' | 'tiktok' | 'pinterest' | 'web'
  nutrition: NutritionInfo | null;
  tags: string[]; // cuisine tags for recommendations
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  listId: string;
  recipeId: string | null;
  name: string;
  amount: string;
  unit: string;
  category: string; // 'PANTRY' | 'FRESH PRODUCE' | 'MEAT & SEAFOOD' | 'DAIRY' | 'BAKERY'
  emoji: string;
  checked: boolean;
  order: number;
}

export interface GroceryList {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt: string;
}

export interface MealPlanEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId: string;
}
