// Pre-built trending recipes with full data — no network fetch needed
// Nutrition calculated from ingredients; health score 1-10 (10 = most nutritious)
// Images self-hosted on GitHub Pages — stable URLs, no CDN expiry

export interface TrendingRecipe {
  id: string;
  title: string;
  image: string;
  importCount: string;
  sourcePlatform: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  tags: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  healthScore: number; // 1-10
  ingredients: { section: string; name: string; amount: string; unit: string; emoji: string }[];
  steps: { order: number; instruction: string; imageUri?: string }[];
}

export const TRENDING_RECIPES: TrendingRecipe[] = [
  {
    "id": "tr_1",
    "title": "Crispy Garlic Parmesan Chicken Wraps",
    "image": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80",
    "importCount": "3.9K",
    "sourcePlatform": "Instagram",
    "servings": 4,
    "prepTime": 15,
    "cookTime": 25,
    "tags": [
      "chicken",
      "wraps",
      "high-protein"
    ],
    "nutrition": {
      "calories": 520,
      "protein": 42,
      "carbs": 38,
      "fat": 22
    },
    "healthScore": 7,
    "ingredients": [
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Boneless Skinless Chicken Thighs",
        "amount": "600",
        "unit": "g",
        "emoji": "🍗"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Chicken Breast",
        "amount": "300",
        "unit": "g",
        "emoji": "🍗"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Salt",
        "amount": "2",
        "unit": "tsp",
        "emoji": "🧂"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Chilli Flakes",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🌶️"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Parsley",
        "amount": "3",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Italian Herbs",
        "amount": "2",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Paprika",
        "amount": "2",
        "unit": "tsp",
        "emoji": "🌶️"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Garlic Granules or Powder",
        "amount": "4",
        "unit": "tsp",
        "emoji": "🧄"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Grated Parmesan",
        "amount": "100",
        "unit": "g",
        "emoji": "🧀"
      },
      {
        "section": "Garlic Parmesan Chicken",
        "name": "Olive Oil",
        "amount": "4",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Garlic Pamesan Creamy Sauce",
        "name": "Light Evaporated Milk",
        "amount": "350",
        "unit": "ml",
        "emoji": "🥛"
      },
      {
        "section": "Garlic Pamesan Creamy Sauce",
        "name": "Italian Herbs",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "Garlic Pamesan Creamy Sauce",
        "name": "Garlic Powder",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🧄"
      },
      {
        "section": "Garlic Pamesan Creamy Sauce",
        "name": "Paprika",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🌶️"
      },
      {
        "section": "Garlic Pamesan Creamy Sauce",
        "name": "Grated Parmesan",
        "amount": "80",
        "unit": "g",
        "emoji": "🧀"
      },
      {
        "section": "Garlic Pamesan Creamy Sauce",
        "name": "Light Butter",
        "amount": "15",
        "unit": "g",
        "emoji": "🧈"
      },
      {
        "section": "Wraps & Filling",
        "name": "Low Carb Wraps",
        "amount": "10",
        "unit": "",
        "emoji": "🫓"
      },
      {
        "section": "Wraps & Filling",
        "name": "Shredded Lettuce",
        "amount": "2",
        "unit": "cups",
        "emoji": "🥬"
      },
      {
        "section": "Wraps & Filling",
        "name": "Chopped Tomatoes",
        "amount": "2",
        "unit": "",
        "emoji": "🍅"
      },
      {
        "section": "Wraps & Filling",
        "name": "Chopped Onions",
        "amount": "1",
        "unit": "",
        "emoji": "🧅"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Slice chicken breast and thighs into cubes. Add seasonings with grated parmesan cheese and a drizzle of olive oil. Mix until well coated.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_1/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "In a pan on low heat, add light butter with seasonings. Toast for a minute before adding evaporated milk, extra Parmesan and cream cheese. Stir till smooth and creamy.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_1/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Line a sheet pan with parchment paper, spread marinated chicken evenly (do not overcrowd), add a light layer of cooking spray. Bake in a preheated oven at 200°C for 20-22 minutes until crispy.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_1/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "While chicken is still hot, add extra parmesan and parsley. Mix well until coated and extra cheesy.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_1/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Assemble the wraps with shredded lettuce, onion, tomato, crispy chicken and sauce. Enjoy!",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_1/step_5.jpg"
      }
    ]
  },
  {
    "id": "tr_2",
    "title": "One-Tray Caramelized Onion & Garlic Pasta",
    "image": "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80",
    "importCount": "1.7K",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 10,
    "cookTime": 45,
    "tags": [
      "pasta",
      "vegetarian",
      "easy"
    ],
    "nutrition": {
      "calories": 440,
      "protein": 16,
      "carbs": 72,
      "fat": 12
    },
    "healthScore": 6,
    "ingredients": [
      {
        "section": "",
        "name": "Large Onions",
        "amount": "3",
        "unit": "",
        "emoji": "🧅"
      },
      {
        "section": "",
        "name": "Garlic Cloves",
        "amount": "8",
        "unit": "",
        "emoji": "🧄"
      },
      {
        "section": "",
        "name": "Olive Oil",
        "amount": "4",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "",
        "name": "Butter",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🧈"
      },
      {
        "section": "",
        "name": "Spaghetti",
        "amount": "400",
        "unit": "g",
        "emoji": "🍝"
      },
      {
        "section": "",
        "name": "Parmesan Cheese",
        "amount": "80",
        "unit": "g",
        "emoji": "🧀"
      },
      {
        "section": "",
        "name": "Fresh Thyme",
        "amount": "4",
        "unit": "sprigs",
        "emoji": "🌿"
      },
      {
        "section": "",
        "name": "Balsamic Vinegar",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "",
        "name": "Salt and Black Pepper",
        "amount": "",
        "unit": "",
        "emoji": "🧂"
      },
      {
        "section": "",
        "name": "Pasta Water",
        "amount": "1",
        "unit": "cup",
        "emoji": "💧"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Slice onions into thin rings. Separate garlic cloves but leave whole.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_2/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Add oil and butter to a large oven-safe pan over medium heat. Add onions, thyme, salt and pepper. Cook stirring occasionally for 10 minutes.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_2/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Transfer to oven at 180°C. Roast for 30 minutes, stirring halfway, until deep golden and caramelized.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_2/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Meanwhile, cook spaghetti in salted water until al dente. Reserve 1 cup pasta water before draining.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_2/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Return pan to stove over medium heat. Add balsamic vinegar and stir. Add cooked pasta and splash of pasta water. Toss well.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_2/step_5.jpg"
      },
      {
        "order": 6,
        "instruction": "Finish with grated parmesan, extra olive oil and black pepper. Serve immediately.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_2/step_6.jpg"
      }
    ]
  },
  {
    "id": "tr_3",
    "title": "Beijing Beef",
    "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
    "importCount": "1.5K",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 20,
    "cookTime": 20,
    "tags": [
      "beef",
      "chinese",
      "takeout"
    ],
    "nutrition": {
      "calories": 580,
      "protein": 36,
      "carbs": 52,
      "fat": 24
    },
    "healthScore": 5,
    "ingredients": [
      {
        "section": "Beef",
        "name": "Flank Steak, thinly sliced",
        "amount": "500",
        "unit": "g",
        "emoji": "🥩"
      },
      {
        "section": "Beef",
        "name": "Cornstarch",
        "amount": "3",
        "unit": "tbsp",
        "emoji": "🌾"
      },
      {
        "section": "Beef",
        "name": "Egg",
        "amount": "1",
        "unit": "",
        "emoji": "🥚"
      },
      {
        "section": "Beef",
        "name": "Vegetable Oil for frying",
        "amount": "2",
        "unit": "cups",
        "emoji": "🫙"
      },
      {
        "section": "Sauce",
        "name": "Hoisin Sauce",
        "amount": "3",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Sauce",
        "name": "Soy Sauce",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Sauce",
        "name": "Rice Vinegar",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Sauce",
        "name": "Honey",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🍯"
      },
      {
        "section": "Sauce",
        "name": "Chilli Garlic Sauce",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🌶️"
      },
      {
        "section": "Sauce",
        "name": "Sesame Oil",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🫙"
      },
      {
        "section": "Vegetables",
        "name": "Red Bell Pepper, sliced",
        "amount": "1",
        "unit": "",
        "emoji": "🫑"
      },
      {
        "section": "Vegetables",
        "name": "Yellow Onion, sliced",
        "amount": "1",
        "unit": "",
        "emoji": "🧅"
      },
      {
        "section": "Vegetables",
        "name": "Garlic Cloves, minced",
        "amount": "3",
        "unit": "",
        "emoji": "🧄"
      },
      {
        "section": "Vegetables",
        "name": "Green Onions for garnish",
        "amount": "2",
        "unit": "",
        "emoji": "🧅"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Mix sliced beef with cornstarch and egg until well coated. Set aside for 15 minutes.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_3/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Whisk together all sauce ingredients in a bowl. Set aside.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_3/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Heat oil in a wok or large pan over high heat. Fry beef in batches until crispy, about 2-3 minutes per batch. Drain on paper towels.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_3/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Remove most of the oil, leaving 2 tbsp. Stir-fry onion and bell pepper for 2 minutes. Add garlic and cook 30 seconds.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_3/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Pour sauce into the pan and bring to a boil. Add crispy beef and toss to coat evenly.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_3/step_5.jpg"
      },
      {
        "order": 6,
        "instruction": "Serve over steamed rice, garnished with green onions.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_3/step_6.jpg"
      }
    ]
  },
  {
    "id": "tr_4",
    "title": "Honey Garlic Salmon",
    "image": "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
    "importCount": "1.3K",
    "sourcePlatform": "Instagram",
    "servings": 2,
    "prepTime": 5,
    "cookTime": 15,
    "tags": [
      "salmon",
      "healthy",
      "quick",
      "high-protein"
    ],
    "nutrition": {
      "calories": 380,
      "protein": 46,
      "carbs": 18,
      "fat": 14
    },
    "healthScore": 9,
    "ingredients": [
      {
        "section": "",
        "name": "Salmon Fillets",
        "amount": "2",
        "unit": "",
        "emoji": "🐟"
      },
      {
        "section": "",
        "name": "Honey",
        "amount": "3",
        "unit": "tbsp",
        "emoji": "🍯"
      },
      {
        "section": "",
        "name": "Soy Sauce",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "",
        "name": "Garlic Cloves, minced",
        "amount": "4",
        "unit": "",
        "emoji": "🧄"
      },
      {
        "section": "",
        "name": "Olive Oil",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "",
        "name": "Lemon Juice",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🍋"
      },
      {
        "section": "",
        "name": "Fresh Parsley",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🌿"
      },
      {
        "section": "",
        "name": "Salt and Pepper",
        "amount": "",
        "unit": "",
        "emoji": "🧂"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Pat salmon dry and season with salt and pepper on both sides.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_4/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Mix honey, soy sauce, garlic and lemon juice in a small bowl.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_4/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Heat olive oil in a non-stick pan over medium-high heat. Cook salmon skin-side up for 4 minutes, then flip.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_4/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Pour honey garlic sauce over salmon. Cook for another 3-4 minutes, basting frequently, until salmon is cooked through and sauce is caramelized.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_4/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Garnish with fresh parsley and serve with steamed vegetables or rice.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_4/step_5.jpg"
      }
    ]
  },
  {
    "id": "tr_5",
    "title": "Creamy Tuscan Chicken",
    "image": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
    "importCount": "1.2K",
    "sourcePlatform": "Instagram",
    "servings": 4,
    "prepTime": 10,
    "cookTime": 25,
    "tags": [
      "chicken",
      "creamy",
      "italian"
    ],
    "nutrition": {
      "calories": 490,
      "protein": 44,
      "carbs": 12,
      "fat": 30
    },
    "healthScore": 6,
    "ingredients": [
      {
        "section": "",
        "name": "Chicken Breasts",
        "amount": "4",
        "unit": "",
        "emoji": "🍗"
      },
      {
        "section": "",
        "name": "Heavy Cream",
        "amount": "300",
        "unit": "ml",
        "emoji": "🥛"
      },
      {
        "section": "",
        "name": "Sun-Dried Tomatoes",
        "amount": "100",
        "unit": "g",
        "emoji": "🍅"
      },
      {
        "section": "",
        "name": "Fresh Spinach",
        "amount": "100",
        "unit": "g",
        "emoji": "🥬"
      },
      {
        "section": "",
        "name": "Garlic Cloves, minced",
        "amount": "4",
        "unit": "",
        "emoji": "🧄"
      },
      {
        "section": "",
        "name": "Parmesan Cheese, grated",
        "amount": "60",
        "unit": "g",
        "emoji": "🧀"
      },
      {
        "section": "",
        "name": "Italian Seasoning",
        "amount": "2",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "",
        "name": "Butter",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🧈"
      },
      {
        "section": "",
        "name": "Olive Oil",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "",
        "name": "Salt and Pepper",
        "amount": "",
        "unit": "",
        "emoji": "🧂"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Season chicken breasts with Italian seasoning, salt and pepper on both sides.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_5/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Heat olive oil and butter in a large pan over medium-high heat. Sear chicken 6-7 minutes per side until golden and cooked through. Set aside.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_5/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "In the same pan, sauté garlic for 1 minute. Add sun-dried tomatoes and cook 2 minutes.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_5/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Pour in heavy cream and bring to a simmer. Stir in parmesan until melted and sauce thickens, about 3 minutes.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_5/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Add spinach and stir until wilted. Return chicken to pan and coat with sauce. Serve with pasta or crusty bread.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_5/step_5.jpg"
      }
    ]
  },
  {
    "id": "tr_6",
    "title": "Avocado Toast with Poached Egg",
    "image": "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80",
    "importCount": "980",
    "sourcePlatform": "Instagram",
    "servings": 2,
    "prepTime": 5,
    "cookTime": 10,
    "tags": [
      "breakfast",
      "healthy",
      "vegetarian",
      "quick"
    ],
    "nutrition": {
      "calories": 320,
      "protein": 14,
      "carbs": 28,
      "fat": 18
    },
    "healthScore": 9,
    "ingredients": [
      {
        "section": "",
        "name": "Sourdough Bread Slices",
        "amount": "2",
        "unit": "",
        "emoji": "🍞"
      },
      {
        "section": "",
        "name": "Ripe Avocado",
        "amount": "1",
        "unit": "",
        "emoji": "🥑"
      },
      {
        "section": "",
        "name": "Eggs",
        "amount": "2",
        "unit": "",
        "emoji": "🥚"
      },
      {
        "section": "",
        "name": "Lemon Juice",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🍋"
      },
      {
        "section": "",
        "name": "Red Pepper Flakes",
        "amount": "1/4",
        "unit": "tsp",
        "emoji": "🌶️"
      },
      {
        "section": "",
        "name": "Everything Bagel Seasoning",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "",
        "name": "Salt and Black Pepper",
        "amount": "",
        "unit": "",
        "emoji": "🧂"
      },
      {
        "section": "",
        "name": "White Vinegar (for poaching)",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🫙"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Toast sourdough slices until golden and crispy.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_6/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Mash avocado with lemon juice, salt and pepper. Spread generously on toast.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_6/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Fill a small saucepan with water, add vinegar, and bring to a gentle simmer. Create a gentle whirlpool and crack each egg into the center. Poach 3-4 minutes for a runny yolk.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_6/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Place poached egg on avocado toast. Season with red pepper flakes and everything bagel seasoning. Serve immediately.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_6/step_4.jpg"
      }
    ]
  },
  {
    "id": "tr_7",
    "title": "Chocolate Lava Cake",
    "image": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80",
    "importCount": "860",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 15,
    "cookTime": 12,
    "tags": [
      "dessert",
      "chocolate",
      "indulgent"
    ],
    "nutrition": {
      "calories": 420,
      "protein": 8,
      "carbs": 46,
      "fat": 24
    },
    "healthScore": 3,
    "ingredients": [
      {
        "section": "",
        "name": "Dark Chocolate (70%)",
        "amount": "170",
        "unit": "g",
        "emoji": "🍫"
      },
      {
        "section": "",
        "name": "Butter",
        "amount": "120",
        "unit": "g",
        "emoji": "🧈"
      },
      {
        "section": "",
        "name": "Eggs",
        "amount": "4",
        "unit": "",
        "emoji": "🥚"
      },
      {
        "section": "",
        "name": "Egg Yolks",
        "amount": "4",
        "unit": "",
        "emoji": "🥚"
      },
      {
        "section": "",
        "name": "Powdered Sugar",
        "amount": "160",
        "unit": "g",
        "emoji": "🍬"
      },
      {
        "section": "",
        "name": "All-Purpose Flour",
        "amount": "60",
        "unit": "g",
        "emoji": "🌾"
      },
      {
        "section": "",
        "name": "Pinch of Salt",
        "amount": "1",
        "unit": "pinch",
        "emoji": "🧂"
      },
      {
        "section": "",
        "name": "Vanilla Extract",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🌿"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Preheat oven to 220°C. Butter four 180ml ramekins and dust with cocoa powder.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_7/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Melt chocolate and butter together in a double boiler or microwave, stirring until smooth. Cool slightly.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_7/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Whisk eggs, egg yolks and sugar together until thick and pale, about 3 minutes.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_7/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Fold chocolate mixture into the egg mixture. Sift in flour and salt, fold until just combined.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_7/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Divide batter evenly among ramekins. Bake 10-12 minutes until edges are set but centre jiggles slightly.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_7/step_5.jpg"
      },
      {
        "order": 6,
        "instruction": "Let sit 1 minute, then invert onto plates. Serve immediately with vanilla ice cream or fresh berries.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_7/step_6.jpg"
      }
    ]
  },
  {
    "id": "tr_8",
    "title": "Greek Chicken Bowl",
    "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
    "importCount": "740",
    "sourcePlatform": "Instagram",
    "servings": 2,
    "prepTime": 15,
    "cookTime": 20,
    "tags": [
      "chicken",
      "mediterranean",
      "healthy",
      "meal-prep"
    ],
    "nutrition": {
      "calories": 420,
      "protein": 48,
      "carbs": 28,
      "fat": 14
    },
    "healthScore": 9,
    "ingredients": [
      {
        "section": "Chicken",
        "name": "Chicken Breast",
        "amount": "400",
        "unit": "g",
        "emoji": "🍗"
      },
      {
        "section": "Chicken",
        "name": "Olive Oil",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Chicken",
        "name": "Lemon Juice",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🍋"
      },
      {
        "section": "Chicken",
        "name": "Garlic, minced",
        "amount": "3",
        "unit": "cloves",
        "emoji": "🧄"
      },
      {
        "section": "Chicken",
        "name": "Dried Oregano",
        "amount": "2",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "Bowl",
        "name": "Cooked Brown Rice or Quinoa",
        "amount": "2",
        "unit": "cups",
        "emoji": "🍚"
      },
      {
        "section": "Bowl",
        "name": "Cherry Tomatoes, halved",
        "amount": "150",
        "unit": "g",
        "emoji": "🍅"
      },
      {
        "section": "Bowl",
        "name": "Cucumber, diced",
        "amount": "1",
        "unit": "",
        "emoji": "🥒"
      },
      {
        "section": "Bowl",
        "name": "Kalamata Olives",
        "amount": "60",
        "unit": "g",
        "emoji": "🫒"
      },
      {
        "section": "Bowl",
        "name": "Feta Cheese, crumbled",
        "amount": "80",
        "unit": "g",
        "emoji": "🧀"
      },
      {
        "section": "Tzatziki",
        "name": "Greek Yogurt",
        "amount": "200",
        "unit": "g",
        "emoji": "🥛"
      },
      {
        "section": "Tzatziki",
        "name": "Cucumber, grated and drained",
        "amount": "1/2",
        "unit": "",
        "emoji": "🥒"
      },
      {
        "section": "Tzatziki",
        "name": "Garlic, minced",
        "amount": "1",
        "unit": "clove",
        "emoji": "🧄"
      },
      {
        "section": "Tzatziki",
        "name": "Dill",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🌿"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Mix olive oil, lemon juice, garlic and oregano. Marinate chicken for at least 15 minutes (up to 4 hours).",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_8/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Mix yogurt, grated cucumber, garlic and dill to make tzatziki. Season and refrigerate.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_8/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Cook marinated chicken in a hot grill pan 6-7 minutes per side until cooked through. Rest 5 minutes, then slice.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_8/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Assemble bowls with rice, sliced chicken, tomatoes, cucumber and olives.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_8/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Top with tzatziki, crumbled feta and a drizzle of olive oil.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_8/step_5.jpg"
      }
    ]
  },
  {
    "id": "tr_9",
    "title": "Crispy Quinoa Asparagus Salad",
    "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    "importCount": "690",
    "sourcePlatform": "Instagram",
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "tags": [
      "vegetarian",
      "healthy",
      "salad",
      "high-fiber"
    ],
    "nutrition": {
      "calories": 290,
      "protein": 12,
      "carbs": 42,
      "fat": 10
    },
    "healthScore": 10,
    "ingredients": [
      {
        "section": "",
        "name": "Quinoa",
        "amount": "200",
        "unit": "g",
        "emoji": "🌾"
      },
      {
        "section": "",
        "name": "Asparagus Spears, trimmed",
        "amount": "300",
        "unit": "g",
        "emoji": "🥦"
      },
      {
        "section": "",
        "name": "Olive Oil",
        "amount": "3",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "",
        "name": "Chickpeas, drained",
        "amount": "400",
        "unit": "g",
        "emoji": "🫘"
      },
      {
        "section": "",
        "name": "Baby Spinach",
        "amount": "100",
        "unit": "g",
        "emoji": "🥬"
      },
      {
        "section": "",
        "name": "Cherry Tomatoes, halved",
        "amount": "200",
        "unit": "g",
        "emoji": "🍅"
      },
      {
        "section": "",
        "name": "Feta Cheese",
        "amount": "100",
        "unit": "g",
        "emoji": "🧀"
      },
      {
        "section": "Lemon Dressing",
        "name": "Lemon Juice",
        "amount": "3",
        "unit": "tbsp",
        "emoji": "🍋"
      },
      {
        "section": "Lemon Dressing",
        "name": "Dijon Mustard",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🫙"
      },
      {
        "section": "Lemon Dressing",
        "name": "Honey",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🍯"
      },
      {
        "section": "Lemon Dressing",
        "name": "Olive Oil",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🫙"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Cook quinoa according to package directions. Spread on a baking sheet and bake at 200°C for 15-20 minutes until crispy, tossing halfway.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_9/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Toss asparagus and chickpeas with olive oil, salt and pepper. Roast at 200°C for 20 minutes until tender.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_9/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Whisk together lemon juice, mustard, honey and olive oil for the dressing.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_9/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Combine spinach, cherry tomatoes, roasted asparagus and chickpeas in a large bowl.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_9/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Add crispy quinoa, drizzle with dressing and toss gently. Top with crumbled feta.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_9/step_5.jpg"
      }
    ]
  },
  {
    "id": "tr_10",
    "title": "Korean Beef Bibimbap",
    "image": "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=600&q=80",
    "importCount": "610",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 20,
    "cookTime": 25,
    "tags": [
      "beef",
      "korean",
      "rice",
      "meal-prep"
    ],
    "nutrition": {
      "calories": 510,
      "protein": 34,
      "carbs": 58,
      "fat": 16
    },
    "healthScore": 7,
    "ingredients": [
      {
        "section": "Beef",
        "name": "Ground Beef",
        "amount": "400",
        "unit": "g",
        "emoji": "🥩"
      },
      {
        "section": "Beef",
        "name": "Soy Sauce",
        "amount": "3",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Beef",
        "name": "Sesame Oil",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Beef",
        "name": "Brown Sugar",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🍬"
      },
      {
        "section": "Beef",
        "name": "Garlic, minced",
        "amount": "3",
        "unit": "cloves",
        "emoji": "🧄"
      },
      {
        "section": "Beef",
        "name": "Ginger, grated",
        "amount": "1",
        "unit": "tsp",
        "emoji": "🌿"
      },
      {
        "section": "Bowl",
        "name": "Cooked White Rice",
        "amount": "3",
        "unit": "cups",
        "emoji": "🍚"
      },
      {
        "section": "Bowl",
        "name": "Shredded Carrots",
        "amount": "150",
        "unit": "g",
        "emoji": "🥕"
      },
      {
        "section": "Bowl",
        "name": "Baby Spinach",
        "amount": "100",
        "unit": "g",
        "emoji": "🥬"
      },
      {
        "section": "Bowl",
        "name": "Cucumber, julienned",
        "amount": "1",
        "unit": "",
        "emoji": "🥒"
      },
      {
        "section": "Bowl",
        "name": "Eggs",
        "amount": "4",
        "unit": "",
        "emoji": "🥚"
      },
      {
        "section": "Bowl",
        "name": "Sesame Seeds",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🌱"
      },
      {
        "section": "Gochujang Sauce",
        "name": "Gochujang",
        "amount": "2",
        "unit": "tbsp",
        "emoji": "🌶️"
      },
      {
        "section": "Gochujang Sauce",
        "name": "Sesame Oil",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🫙"
      },
      {
        "section": "Gochujang Sauce",
        "name": "Rice Vinegar",
        "amount": "1",
        "unit": "tbsp",
        "emoji": "🫙"
      }
    ],
    "steps": [
      {
        "order": 1,
        "instruction": "Mix soy sauce, sesame oil, brown sugar, garlic and ginger. Brown ground beef in a pan, add sauce and cook until glazed.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_10/step_1.jpg"
      },
      {
        "order": 2,
        "instruction": "Quickly sauté carrots and spinach separately with a little sesame oil and salt.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_10/step_2.jpg"
      },
      {
        "order": 3,
        "instruction": "Whisk gochujang sauce ingredients together.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_10/step_3.jpg"
      },
      {
        "order": 4,
        "instruction": "Fry eggs sunny-side up.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_10/step_4.jpg"
      },
      {
        "order": 5,
        "instruction": "Divide rice into bowls. Arrange beef, carrots, spinach and cucumber over rice. Top with a fried egg, drizzle gochujang sauce and sprinkle sesame seeds.",
        "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_10/step_5.jpg"
      }
    ]
  },
  {
    "id": "tr_11",
    "title": "Dirty Martini Pasta",
    "image": "https://www.recipetineats.com/tachyon/2014/08/Beef-Cheeks-Pasta-2-1.jpg",
    "importCount": "4.2K",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 15,
    "cookTime": 15,
    "tags": ["pasta", "martini", "cocktail", "italian", "quick"],
    "nutrition": { "calories": 797, "protein": 24, "carbs": 68, "fat": 48 },
    "healthScore": 5,
    "ingredients": [
      { "section": "Pasta", "name": "Spaghetti or Linguine", "amount": "12", "unit": "oz", "emoji": "🍝" },
      { "section": "Pasta", "name": "Olive Oil", "amount": "2", "unit": "tbsp", "emoji": "🫙" },
      { "section": "Pasta", "name": "Garlic Cloves", "amount": "4", "unit": "cloves", "emoji": "🧄" },
      { "section": "Martini Infusion", "name": "Castelvetrano Olives", "amount": "1", "unit": "cup", "emoji": "🫒" },
      { "section": "Martini Infusion", "name": "Olive Brine", "amount": "1/3", "unit": "cup", "emoji": "🫙" },
      { "section": "Martini Infusion", "name": "Lemon Zest", "amount": "1", "unit": "tbsp", "emoji": "🍋" },
      { "section": "Martini Infusion", "name": "Gin or Vodka", "amount": "1/3", "unit": "cup", "emoji": "🍸" },
      { "section": "Cream Sauce", "name": "Heavy Cream", "amount": "2/3", "unit": "cup", "emoji": "🥛" },
      { "section": "Cream Sauce", "name": "Grated Parmesan", "amount": "2/3", "unit": "cup", "emoji": "🧀" },
      { "section": "Cream Sauce", "name": "Unsalted Butter", "amount": "3", "unit": "tbsp", "emoji": "🧈" },
      { "section": "Finishing", "name": "Fresh Parsley", "amount": "1/3", "unit": "cup", "emoji": "🌿" },
      { "section": "Finishing", "name": "Salt", "amount": "1/2", "unit": "tsp", "emoji": "🧂" },
      { "section": "Finishing", "name": "Black Pepper", "amount": "1/4", "unit": "tsp", "emoji": "🌶️" }
    ],
    "steps": [
      { "order": 1, "instruction": "Cook pasta according to package directions until al dente. Reserve 1/2 cup pasta water before draining.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_11/step_1.jpg" },
      { "order": 2, "instruction": "In a large skillet, heat olive oil over medium heat. Add minced garlic and cook until fragrant, about 1 minute.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_11/step_2.jpg" },
      { "order": 3, "instruction": "Add gin or vodka to the skillet and cook for 2 minutes until slightly reduced. Stir in the olive brine and lemon zest.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_11/step_3.jpg" },
      { "order": 4, "instruction": "Pour in heavy cream and bring to a gentle simmer. Add butter and stir until melted. Stir in Parmesan until smooth.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_11/step_4.jpg" },
      { "order": 5, "instruction": "Add drained pasta to the skillet and toss to coat. Add pasta water as needed to loosen the sauce. Stir in olives and parsley.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_11/step_5.jpg" },
      { "order": 6, "instruction": "Season with salt and pepper. Serve immediately with extra Parmesan and a martini olive on top for garnish.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_11/step_6.jpg" }
    ]
  },
  {
    "id": "tr_12",
    "title": "Emily Mariko's Salmon Rice Bowl",
    "image": "https://www.recipetineats.com/tachyon/2014/11/Sirloin-Steak-with-Pesto-Capsicum-and-Flatbread-2.jpg",
    "importCount": "8.1K",
    "sourcePlatform": "TikTok",
    "servings": 1,
    "prepTime": 5,
    "cookTime": 10,
    "tags": ["salmon", "rice bowl", "japanese", "healthy", "quick"],
    "nutrition": { "calories": 420, "protein": 32, "carbs": 45, "fat": 14 },
    "healthScore": 9,
    "ingredients": [
      { "section": "Base", "name": "Cooked Salmon", "amount": "3-4", "unit": "oz", "emoji": "🐟" },
      { "section": "Base", "name": "Leftover Rice", "amount": "1.5", "unit": "cups", "emoji": "🍚" },
      { "section": "Base", "name": "Water", "amount": "1", "unit": "tbsp", "emoji": "💧" },
      { "section": "Sauce", "name": "Soy Sauce", "amount": "1", "unit": "tbsp", "emoji": "🥫" },
      { "section": "Sauce", "name": "Kewpie Mayo", "amount": "2", "unit": "tsp", "emoji": "🥚" },
      { "section": "Sauce", "name": "Sriracha", "amount": "2", "unit": "tsp", "emoji": "🌶️" },
      { "section": "Toppings", "name": "Avocado", "amount": "1/2", "unit": "", "emoji": "🥑" },
      { "section": "Toppings", "name": "Kimchi", "amount": "1/4", "unit": "cup", "emoji": "🥬" },
      { "section": "Toppings", "name": "Scallions", "amount": "2", "unit": "tbsp", "emoji": "🧅" },
      { "section": "Toppings", "name": "Toasted Sesame Seeds", "amount": "1", "unit": "tsp", "emoji": "🌾" },
      { "section": "Toppings", "name": "Seaweed Snacks", "amount": "2", "unit": "sheets", "emoji": "海苔" }
    ],
    "steps": [
      { "order": 1, "instruction": "Place cooked salmon in a microwave-safe bowl. Using a fork, flake it until it resembles canned salmon texture.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_12/step_1.jpg" },
      { "order": 2, "instruction": "Add leftover rice to the bowl and sprinkle with about 1 tablespoon of water. This adds moisture back into the rice.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_12/step_2.jpg" },
      { "order": 3, "instruction": "Mix soy sauce, Kewpie mayo, and Sriracha in a small bowl to create the spicy salmon sauce.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_12/step_3.jpg" },
      { "order": 4, "instruction": "Microwave the salmon and rice for 1-2 minutes until warmed through. Top with sliced avocado and kimchi.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_12/step_4.jpg" },
      { "order": 5, "instruction": "Drizzle with spicy mayo sauce. Garnish with thinly sliced scallions, sesame seeds, and crumbled seaweed snacks.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_12/step_5.jpg" }
    ]
  },
  {
    "id": "tr_13",
    "title": "Nutella-Banana Baked Oats",
    "image": "https://www.recipetineats.com/tachyon/2014/12/Croque-Madame-2.jpg",
    "importCount": "3.5K",
    "sourcePlatform": "TikTok",
    "servings": 2,
    "prepTime": 5,
    "cookTime": 15,
    "tags": ["oats", "breakfast", "banana", "nutella", "baked", "healthy"],
    "nutrition": { "calories": 380, "protein": 12, "carbs": 58, "fat": 14 },
    "healthScore": 7,
    "ingredients": [
      { "section": "Batter", "name": "Rolled Oats", "amount": "1", "unit": "cup", "emoji": "🌾" },
      { "section": "Batter", "name": "Ripe Banana", "amount": "1", "unit": "large", "emoji": "🍌" },
      { "section": "Batter", "name": "Eggs", "amount": "2", "unit": "large", "emoji": "🥚" },
      { "section": "Batter", "name": "Milk", "amount": "1/2", "unit": "cup", "emoji": "🥛" },
      { "section": "Batter", "name": "Baking Powder", "amount": "1", "unit": "tsp", "emoji": "🧂" },
      { "section": "Batter", "name": "Vanilla Extract", "amount": "1/2", "unit": "tsp", "emoji": "🍦" },
      { "section": "Topping", "name": "Nutella", "amount": "3", "unit": "tbsp", "emoji": "🍫" },
      { "section": "Topping", "name": "Sliced Banana", "amount": "1", "unit": "medium", "emoji": "🍌" },
      { "section": "Topping", "name": "Chocolate Chips", "amount": "2", "unit": "tbsp", "emoji": "🍫" }
    ],
    "steps": [
      { "order": 1, "instruction": "Preheat oven to 350°F (175°C). Grease 2 ramekins or baking dish with butter or cooking spray.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_13/step_1.jpg" },
      { "order": 2, "instruction": "Add oats, banana, eggs, milk, baking powder, and vanilla to a blender. Blend until smooth and creamy.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_13/step_2.jpg" },
      { "order": 3, "instruction": "Pour the oat mixture evenly into the prepared ramekins. Drop spoonfuls of Nutella on top.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_13/step_3.jpg" },
      { "order": 4, "instruction": "Use a toothpick or knife to swirl the Nutella into a figure-8 pattern for a marbled effect.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_13/step_4.jpg" },
      { "order": 5, "instruction": "Top with sliced banana and chocolate chips. Bake for 15-18 minutes until set and golden.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_13/step_5.jpg" },
      { "order": 6, "instruction": "Let cool for 2 minutes. Serve warm with extra Nutella for dipping if desired.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_13/step_6.jpg" }
    ]
  },
  {
    "id": "tr_14",
    "title": "Green Goddess Salad",
    "image": "https://www.recipetineats.com/tachyon/2014/09/DSC_0170-1.jpg",
    "importCount": "5.7K",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 5,
    "cookTime": 0,
    "tags": ["salad", "green goddess", "healthy", "vegetarian", "no-cook"],
    "nutrition": { "calories": 280, "protein": 8, "carbs": 18, "fat": 22 },
    "healthScore": 8,
    "ingredients": [
      { "section": "Salad Base", "name": "Napa Cabbage", "amount": "4", "unit": "cups", "emoji": "🥬" },
      { "section": "Salad Base", "name": "English Cucumber", "amount": "1", "unit": "medium", "emoji": "🥒" },
      { "section": "Salad Base", "name": "Avocado", "amount": "1", "unit": "large", "emoji": "🥑" },
      { "section": "Fresh Herbs", "name": "Fresh Basil", "amount": "1/2", "unit": "cup", "emoji": "🌿" },
      { "section": "Fresh Herbs", "name": "Fresh Parsley", "amount": "1/4", "unit": "cup", "emoji": "🌿" },
      { "section": "Fresh Herbs", "name": "Fresh Dill", "amount": "2", "unit": "tbsp", "emoji": "🌿" },
      { "section": "Fresh Herbs", "name": "Chives", "amount": "2", "unit": "tbsp", "emoji": "🧅" },
      { "section": "Dressing", "name": "Greek Yogurt", "amount": "1/2", "unit": "cup", "emoji": "🥛" },
      { "section": "Dressing", "name": "Olive Oil", "amount": "2", "unit": "tbsp", "emoji": "🫙" },
      { "section": "Dressing", "name": "Lemon Juice", "amount": "2", "unit": "tbsp", "emoji": "🍋" },
      { "section": "Dressing", "name": "Garlic Cloves", "amount": "2", "unit": "cloves", "emoji": "🧄" },
      { "section": "Dressing", "name": "Salt", "amount": "1/2", "unit": "tsp", "emoji": "🧂" }
    ],
    "steps": [
      { "order": 1, "instruction": "Thinly slice the napa cabbage and place in a large salad bowl. Chop cucumber into half-moons.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_14/step_1.jpg" },
      { "order": 2, "instruction": "Cut avocado in half, remove pit, and slice into thin strips. Add cabbage, cucumber, and avocado to bowl.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_14/step_2.jpg" },
      { "order": 3, "instruction": "Make the green goddess dressing: blend Greek yogurt, olive oil, lemon juice, garlic, basil, parsley, dill, and salt until smooth.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_14/step_3.jpg" },
      { "order": 4, "instruction": "Pour dressing over salad and toss gently to coat everything evenly.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_14/step_4.jpg" },
      { "order": 5, "instruction": "Top with extra fresh herbs and chives. Serve immediately or refrigerate for up to 2 hours.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_14/step_5.jpg" }
    ]
  },
  {
    "id": "tr_15",
    "title": "Golden Girl Salad with Sweet Corn Vinaigrette",
    "image": "https://www.recipetineats.com/tachyon/2014/07/Giant-Hash-Brown-1-1.jpg",
    "importCount": "2.9K",
    "sourcePlatform": "TikTok",
    "servings": 6,
    "prepTime": 15,
    "cookTime": 20,
    "tags": ["salad", "corn", "tomatoes", "feta", "summer", "vegetarian"],
    "nutrition": { "calories": 320, "protein": 12, "carbs": 28, "fat": 20 },
    "healthScore": 8,
    "ingredients": [
      { "section": "Salad", "name": "Fresh Corn Kernels", "amount": "3", "unit": "cups", "emoji": "🌽" },
      { "section": "Salad", "name": "Cherry Tomatoes", "amount": "2", "unit": "cups", "emoji": "🍅" },
      { "section": "Salad", "name": "English Cucumber", "amount": "1", "unit": "large", "emoji": "🥒" },
      { "section": "Salad", "name": "Feta Cheese", "amount": "1", "unit": "cup", "emoji": "🧀" },
      { "section": "Salad", "name": "Red Onion", "amount": "1/2", "unit": "small", "emoji": "🧅" },
      { "section": "Salad", "name": "Fresh Basil", "amount": "1/2", "unit": "cup", "emoji": "🌿" },
      { "section": "Vinaigrette", "name": "Corn Oil or Neutral Oil", "amount": "1/4", "unit": "cup", "emoji": "🫙" },
      { "section": "Vinaigrette", "name": "Honey", "amount": "2", "unit": "tbsp", "emoji": "🍯" },
      { "section": "Vinaigrette", "name": "Apple Cider Vinegar", "amount": "2", "unit": "tbsp", "emoji": "🍎" },
      { "section": "Vinaigrette", "name": "Salt", "amount": "1/2", "unit": "tsp", "emoji": "🧂" },
      { "section": "Vinaigrette", "name": "Black Pepper", "amount": "1/4", "unit": "tsp", "emoji": "🌶️" }
    ],
    "steps": [
      { "order": 1, "instruction": "Cook corn in a skillet over medium-high heat until charred in spots, about 8-10 minutes. Let cool slightly.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_15/step_1.jpg" },
      { "order": 2, "instruction": "Halve the cherry tomatoes and dice the cucumber. Thinly slice the red onion and roughly tear the basil leaves.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_15/step_2.jpg" },
      { "order": 3, "instruction": "Make the sweet corn vinaigrette: blend 1 cup of the charred corn with oil, honey, vinegar, salt, and pepper until smooth.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_15/step_3.jpg" },
      { "order": 4, "instruction": "In a large bowl, combine remaining corn, tomatoes, cucumber, onion, and basil. Crumble feta cheese over top.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_15/step_4.jpg" },
      { "order": 5, "instruction": "Drizzle the sweet corn vinaigrette over the salad and toss gently. Season with extra salt and pepper to taste.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_15/step_5.jpg" },
      { "order": 6, "instruction": "Serve immediately or let marinate for 30 minutes in the fridge for extra flavor.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_15/step_6.jpg" }
    ]
  },
  {
    "id": "tr_16",
    "title": "Marry Me Chicken",
    "image": "https://www.recipetineats.com/tachyon/2015/02/Mini-French-Toast-PS-Edited-FINAL1.jpg",
    "importCount": "7.8K",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 10,
    "cookTime": 30,
    "tags": ["chicken", "creamy", "sun-dried tomatoes", "spinach", "date night"],
    "nutrition": { "calories": 550, "protein": 42, "carbs": 12, "fat": 38 },
    "healthScore": 6,
    "ingredients": [
      { "section": "Chicken", "name": "Chicken Thighs", "amount": "1.5", "unit": "lbs", "emoji": "🍗" },
      { "section": "Chicken", "name": "Olive Oil", "amount": "2", "unit": "tbsp", "emoji": "🫙" },
      { "section": "Chicken", "name": "Italian Seasoning", "amount": "1", "unit": "tsp", "emoji": "🌿" },
      { "section": "Chicken", "name": "Salt", "amount": "1/2", "unit": "tsp", "emoji": "🧂" },
      { "section": "Chicken", "name": "Red Pepper Flakes", "amount": "1/4", "unit": "tsp", "emoji": "🌶️" },
      { "section": "Sauce", "name": "Garlic Cloves", "amount": "4", "unit": "cloves", "emoji": "🧄" },
      { "section": "Sauce", "name": "Sun-Dried Tomatoes", "amount": "1/2", "unit": "cup", "emoji": "🍅" },
      { "section": "Sauce", "name": "Heavy Cream", "amount": "1", "unit": "cup", "emoji": "🥛" },
      { "section": "Sauce", "name": "Chicken Broth", "amount": "1/2", "unit": "cup", "emoji": "🍗" },
      { "section": "Sauce", "name": "Grated Parmesan", "amount": "1/2", "unit": "cup", "emoji": "🧀" },
      { "section": "Sauce", "name": "Unsalted Butter", "amount": "2", "unit": "tbsp", "emoji": "🧈" },
      { "section": "Finish", "name": "Fresh Spinach", "amount": "2", "unit": "cups", "emoji": "🥬" },
      { "section": "Finish", "name": "Fresh Basil", "amount": "2", "unit": "tbsp", "emoji": "🌿" }
    ],
    "steps": [
      { "order": 1, "instruction": "Season chicken thighs with Italian seasoning, salt, and red pepper flakes on both sides.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_1.jpg" },
      { "order": 2, "instruction": "Heat olive oil in a large skillet over medium-high heat. Sear chicken for 4-5 minutes per side until golden. Set aside.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_2.jpg" },
      { "order": 3, "instruction": "In the same skillet, add minced garlic and sun-dried tomatoes. Cook for 1 minute until fragrant.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_3.jpg" },
      { "order": 4, "instruction": "Pour in heavy cream and chicken broth. Bring to a simmer, scraping up any browned bits from the pan.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_4.jpg" },
      { "order": 5, "instruction": "Stir in Parmesan and butter until melted and smooth. Add spinach and stir until wilted.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_5.jpg" },
      { "order": 6, "instruction": "Return chicken to the skillet and spoon sauce over the top. Simmer for 5-8 minutes until chicken is cooked through.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_6.jpg" },
      { "order": 7, "instruction": "Garnish with fresh basil and serve over pasta, rice, or with crusty bread to soak up the sauce.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_16/step_7.jpg" }
    ]
  },
  {
    "id": "tr_17",
    "title": "Breakfast Ramen",
    "image": "https://www.recipetineats.com/tachyon/2014/10/Huevos-Rancheros-Tortilla-Bowls-1-1.jpg",
    "importCount": "2.3K",
    "sourcePlatform": "TikTok",
    "servings": 1,
    "prepTime": 5,
    "cookTime": 10,
    "tags": ["ramen", "breakfast", "bacon", "eggs", "savory", "quick"],
    "nutrition": { "calories": 480, "protein": 22, "carbs": 56, "fat": 22 },
    "healthScore": 6,
    "ingredients": [
      { "section": "Ramen", "name": "Instant Ramen Pack", "amount": "1", "unit": "packet", "emoji": "🍜" },
      { "section": "Ramen", "name": "Bacon", "amount": "3", "unit": "strips", "emoji": "🥓" },
      { "section": "Ramen", "name": "Eggs", "amount": "2", "unit": "large", "emoji": "🥚" },
      { "section": "Ramen", "name": "Scallions", "amount": "2", "unit": "tbsp", "emoji": "🧅" },
      { "section": "Ramen", "name": "Soy Sauce", "amount": "1", "unit": "tbsp", "emoji": "🥫" },
      { "section": "Ramen", "name": "Sesame Oil", "amount": "1/2", "unit": "tsp", "emoji": "🫙" },
      { "section": "Ramen", "name": "Optional: Nori Sheet", "amount": "1", "unit": "sheet", "emoji": "海苔" },
      { "section": "Ramen", "name": "Optional: Chili Oil", "amount": "1", "unit": "tsp", "emoji": "🌶️" }
    ],
    "steps": [
      { "order": 1, "instruction": "Cook bacon in a small pan until crispy. Set aside and crumble when cool. Reserve the bacon fat in the pan.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_17/step_1.jpg" },
      { "order": 2, "instruction": "Bring a pot of water to boil. Cook ramen noodles according to package directions, about 3 minutes.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_17/step_2.jpg" },
      { "order": 3, "instruction": "While noodles cook, fry eggs in the bacon fat to your preference (over-easy or sunny-side up works great).", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_17/step_3.jpg" },
      { "order": 4, "instruction": "Drain noodles and add to a bowl. Season with soy sauce, sesame oil, and half the ramen seasoning packet.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_17/step_4.jpg" },
      { "order": 5, "instruction": "Top with crumbled bacon, fried egg, sliced scallions, and nori. Add chili oil if you like it spicy.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_17/step_5.jpg" },
      { "order": 6, "instruction": "Crack the yolk when eating to create a creamy sauce. Mix everything together and enjoy!", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_17/step_6.jpg" }
    ]
  },
  {
    "id": "tr_18",
    "title": "Baked Feta Pasta",
    "image": "https://www.recipetineats.com/tachyon/2014/07/Teriyaki-Sauce-1-copy-1.jpg",
    "importCount": "9.4K",
    "sourcePlatform": "TikTok",
    "servings": 4,
    "prepTime": 10,
    "cookTime": 35,
    "tags": ["pasta", "feta", "tomatoes", "greek", "vegetarian", "viral"],
    "nutrition": { "calories": 620, "protein": 18, "carbs": 72, "fat": 32 },
    "healthScore": 5,
    "ingredients": [
      { "section": "Pasta", "name": "Penne or Rigatoni", "amount": "1", "unit": "lb", "emoji": "🍝" },
      { "section": "Main", "name": "Block Feta Cheese", "amount": "8", "unit": "oz", "emoji": "🧀" },
      { "section": "Main", "name": "Cherry Tomatoes", "amount": "2", "unit": "pints", "emoji": "🍅" },
      { "section": "Main", "name": "Garlic Cloves", "amount": "5", "unit": "cloves", "emoji": "🧄" },
      { "section": "Main", "name": "Olive Oil", "amount": "1/3", "unit": "cup", "emoji": "🫙" },
      { "section": "Seasoning", "name": "Dried Oregano", "amount": "1", "unit": "tsp", "emoji": "🌿" },
      { "section": "Seasoning", "name": "Red Pepper Flakes", "amount": "1/2", "unit": "tsp", "emoji": "🌶️" },
      { "section": "Seasoning", "name": "Salt", "amount": "1/2", "unit": "tsp", "emoji": "🧂" },
      { "section": "Seasoning", "name": "Black Pepper", "amount": "1/4", "unit": "tsp", "emoji": "🌶️" },
      { "section": "Finish", "name": "Fresh Basil", "amount": "1/2", "unit": "cup", "emoji": "🌿" },
      { "section": "Finish", "name": "Fresh Parsley", "amount": "2", "unit": "tbsp", "emoji": "🌿" }
    ],
    "steps": [
      { "order": 1, "instruction": "Preheat oven to 400°F (200°C). Place cherry tomatoes and garlic cloves in a 9x13 baking dish.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_1.jpg" },
      { "order": 2, "instruction": "Drizzle tomatoes and garlic with olive oil, then place the block of feta in the center of the dish.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_2.jpg" },
      { "order": 3, "instruction": "Sprinkle oregano, red pepper flakes, salt, and pepper over everything. Add a drizzle more of olive oil on top of the feta.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_3.jpg" },
      { "order": 4, "instruction": "Bake for 30-35 minutes until tomatoes burst and feta is golden and soft on top.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_4.jpg" },
      { "order": 5, "instruction": "While baking, cook pasta until al dente. Reserve 1 cup pasta water before draining.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_5.jpg" },
      { "order": 6, "instruction": "Mash the baked tomatoes and feta together with a fork until creamy. Stir in cooked pasta, adding pasta water as needed.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_6.jpg" },
      { "order": 7, "instruction": "Tear fresh basil and parsley over the pasta. Toss everything together and serve immediately.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_18/step_7.jpg" }
    ]
  },
  {
    "id": "tr_19",
    "title": "Upside-Down Cream of Mushroom Tartlets",
    "image": "https://www.recipetineats.com/tachyon/2014/05/Watermelon-Salad-v2.jpg",
    "importCount": "1.8K",
    "sourcePlatform": "TikTok",
    "servings": 6,
    "prepTime": 30,
    "cookTime": 45,
    "tags": ["mushroom", "tartlets", "appetizer", "pastry", "french", "elegant"],
    "nutrition": { "calories": 420, "protein": 10, "carbs": 32, "fat": 30 },
    "healthScore": 5,
    "ingredients": [
      { "section": "Pastry", "name": "All-Butter Puff Pastry", "amount": "1", "unit": "sheet", "emoji": "🥐" },
      { "section": "Mushroom Filling", "name": "Mixed Mushrooms", "amount": "12", "unit": "oz", "emoji": "🍄" },
      { "section": "Mushroom Filling", "name": "Heavy Cream", "amount": "1", "unit": "cup", "emoji": "🥛" },
      { "section": "Mushroom Filling", "name": "Egg Yolks", "amount": "2", "unit": "large", "emoji": "🥚" },
      { "section": "Mushroom Filling", "name": "Gruyere Cheese", "amount": "1/2", "unit": "cup", "emoji": "🧀" },
      { "section": "Aromatics", "name": "Shallots", "amount": "2", "unit": "medium", "emoji": "🧅" },
      { "section": "Aromatics", "name": "Garlic Cloves", "amount": "2", "unit": "cloves", "emoji": "🧄" },
      { "section": "Aromatics", "name": "Fresh Thyme", "amount": "4", "unit": "sprigs", "emoji": "🌿" },
      { "section": "Aromatics", "name": "Dry White Wine", "amount": "1/4", "unit": "cup", "emoji": "🍷" },
      { "section": "Base", "name": "Butter", "amount": "2", "unit": "tbsp", "emoji": "🧈" },
      { "section": "Base", "name": "Salt", "amount": "1/2", "unit": "tsp", "emoji": "🧂" },
      { "section": "Base", "name": "Black Pepper", "amount": "1/4", "unit": "tsp", "emoji": "🌶️" }
    ],
    "steps": [
      { "order": 1, "instruction": "Preheat oven to 375°F (190°C). Slice mushrooms and mince shallots and garlic.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_1.jpg" },
      { "order": 2, "instruction": "Cut puff pastry into rounds slightly larger than your muffin tin cups. Press into greased muffin tin cavities.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_2.jpg" },
      { "order": 3, "instruction": "Melt butter in a skillet over medium heat. Sauté mushrooms with shallots, garlic, and thyme until golden, about 8 minutes.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_3.jpg" },
      { "order": 4, "instruction": "Deglaze with white wine, cook until evaporated. Remove thyme stems. Stir in cream and bring to simmer.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_4.jpg" },
      { "order": 5, "instruction": "Whisk egg yolks with cheese, salt, and pepper. Stir into the warm mushroom mixture until combined.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_5.jpg" },
      { "order": 6, "instruction": "Divide mushroom filling among pastry-lined cups. Bake for 25-30 minutes until pastry is golden and filling is set.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_6.jpg" },
      { "order": 7, "instruction": "Let cool for 5 minutes, then invert onto a platter so the golden mushroom side faces up. Serve warm.", "imageUri": "https://huangrui199126.github.io/receipe-me/data/recipes/tr_19/step_7.jpg" }
    ]
  }
];
