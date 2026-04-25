#!/usr/bin/env python3
"""Generate trending recipes and write to docs/data/"""
import json, os, pathlib

OUT = pathlib.Path(__file__).parent.parent / "docs" / "data"
RECIPES_DIR = OUT / "recipes"

# ---------------------------------------------------------------------------
# Unsplash cover photo IDs — 44 verified valid IDs (HEAD → HTTP 200, 2026-04-24)
# ---------------------------------------------------------------------------
IMG = lambda id: f"https://images.unsplash.com/photo-{id}?w=600&q=80"

# Full verified pool — use for bulk/fallback image assignment
VERIFIED_IDS = [
    "1432139555190-58524dae6a55",  # creamy chicken / pasta
    "1466637574441-749b8f19452f",  # Mediterranean / kofta
    "1467003909585-2f8a72700288",  # salmon / fish
    "1476224203421-9ac39bcb3327",  # plated food
    "1482049016688-2d3e1b311543",  # food spread / eggs
    "1484723091739-30a097e8f929",  # pasta / bread
    "1490474418585-ba9bad8fd0ea",  # smoothie / tropical
    "1490645935967-10de6ba17061",  # breakfast plate
    "1504674900247-0877df9cc836",  # pizza / Italian
    "1507048331197-7d4ac70811cf",  # cooking / pot
    "1512621776951-a57141f2eefd",  # vegetables / salad
    "1525351484163-7529414344d8",  # avocado / egg
    "1546069901-ba9599a7e63c",     # bowl / salad colorful
    "1547592180-85f173990554",     # soup / congee
    "1553163147-622ab57be1c7",     # Korean / rice bowl
    "1555939594-58d7cb561ad1",     # ramen / noodles
    "1556909114-f6e7ad7d3136",     # mixing / prep
    "1563379926898-05f4575a45d8",  # banh mi / sandwich
    "1564355808539-22fda35bed7e",  # dessert / chocolate
    "1574071318508-1cdbab80d002",  # baked / pie
    "1604908176997-125f25cc6f3d",  # stir fry / Asian beef
    "1621996346565-e3dbc646d9a9",  # pasta / noodles
    "1626700051175-6818013e1d4f",  # chicken / wraps
    "1528735602780-2552fd46c7af",  # fresh produce
    "1565299624946-b28f40a0ae38",  # grilled food
    "1529042410759-befb1204b468",  # colorful bowls
    "1540420773420-3366772f4999",  # tacos / Mexican
    "1518779578993-ec3579fee39f",  # noodle soup
    "1498837167922-ddd27525d352",  # salad / greens
    "1476718406336-bb5a9690ee2a",  # berries / fruit
    "1555949258-eb67b1ef0ceb",     # Asian / dumplings
    "1551024601-bec78aea704b",     # baking / dough
    "1571091718767-18b5b1457add",  # burger / sandwich
    "1565299585323-38d6b0865b47",  # flatbread / pizza
    "1512058564366-18510be2db19",  # rice / grain bowl
    "1569050467447-ce54b3bbc37d",  # dim sum / Asian
    "1586190848861-99aa4a171e90",  # soup / stew
    "1565958011703-44f9829ba187",  # cheese / dairy
    "1526318896980-cf78c088247c",  # curry / spiced
    "1608198093002-ad4e005484ec",  # oats / breakfast
    "1568901346375-23c9450c58cd",  # curry / Indian
    "1601050690597-df0568f70950",  # chopping / fresh
    "1530554764233-e79e16c91d08",  # eggs / breakfast
    "1534422298391-e4f8c172dddb",  # noodles / stir fry
]

STEP_IMGS = {
    "prep":   IMG("1490645935967-10de6ba17061"),
    "mix":    IMG("1556909114-f6e7ad7d3136"),
    "cook":   IMG("1507048331197-7d4ac70811cf"),
    "plate":  IMG("1466637574441-749b8f19452f"),
    "bake":   IMG("1574071318508-1cdbab80d002"),
    "grill":  IMG("1555939594-58d7cb561ad1"),
    "chop":   IMG("1601050690597-df0568f70950"),
    "season": IMG("1512621776951-a57141f2eefd"),
    "simmer": IMG("1568901346375-23c9450c58cd"),
    "serve":  IMG("1476224203421-9ac39bcb3327"),
}

def steps(*instructions):
    keys = list(STEP_IMGS.keys())
    return [{"order": i+1, "instruction": inst, "imageUri": STEP_IMGS[keys[i % len(keys)]]}
            for i, inst in enumerate(instructions)]

def ing(name, amount, unit, emoji):
    return {"name": name, "amount": str(amount), "unit": unit, "emoji": emoji}

def sec(section, items):
    return [{"section": section, **i} for i in items]

# ---------------------------------------------------------------------------
# Recipe definitions
# ---------------------------------------------------------------------------
RECIPES = [
  # ---- BREAKFAST ----------------------------------------------------------
  {
    "id": "tr_11", "title": "Fluffy Japanese Pancakes",
    "image": IMG("1534422298391-e4f8c172dddb"), "importCount": "5.2K",
    "sourcePlatform": "TikTok", "cuisine": "Japanese", "category": "Breakfast",
    "servings": 2, "prepTime": 15, "cookTime": 20,
    "tags": ["pancakes","breakfast","fluffy","japanese"],
    "nutrition": {"calories": 380, "protein": 12, "carbs": 55, "fat": 12},
    "healthScore": 6,
    "ingredients": sec("Batter",[
      ing("All-Purpose Flour","100","g","🌾"), ing("Baking Powder","2","tsp","🥄"),
      ing("Sugar","2","tbsp","🍚"), ing("Milk","120","ml","🥛"),
      ing("Eggs","2","","🥚"), ing("Vanilla Extract","1","tsp","🍶"),
      ing("Butter","15","g","🧈"),
    ]),
    "steps": steps(
      "Separate egg yolks from whites. Mix yolks with milk, melted butter, and vanilla.",
      "Sift flour and baking powder into the yolk mixture and fold gently.",
      "Beat egg whites with sugar until stiff peaks form.",
      "Fold egg whites into batter in three additions — keep it airy.",
      "Cook on low heat in a greased ring mold, covered, 4-5 min per side.",
      "Stack and serve with maple syrup and fresh berries.",
    ),
  },
  {
    "id": "tr_12", "title": "Masala Omelette",
    "image": IMG("1530554764233-e79e16c91d08"), "importCount": "2.8K",
    "sourcePlatform": "Instagram", "cuisine": "Indian", "category": "Breakfast",
    "servings": 1, "prepTime": 5, "cookTime": 8,
    "tags": ["eggs","indian","spicy","breakfast","quick"],
    "nutrition": {"calories": 290, "protein": 20, "carbs": 8, "fat": 19},
    "healthScore": 8,
    "ingredients": sec("Omelette",[
      ing("Eggs","3","","🥚"), ing("Onion","1/4","","🧅"),
      ing("Green Chilli","1","","🌶️"), ing("Tomato","1/4","","🍅"),
      ing("Cumin Seeds","1/2","tsp","🌿"), ing("Turmeric","1/4","tsp","🟡"),
      ing("Coriander Leaves","2","tbsp","🌿"), ing("Butter","1","tbsp","🧈"),
    ]),
    "steps": steps(
      "Finely dice onion, tomato, and green chilli.",
      "Beat eggs with turmeric, salt, and cumin seeds.",
      "Add vegetables and chopped coriander to the egg mixture.",
      "Heat butter in a pan over medium heat and pour in the egg mixture.",
      "Cook until set on the bottom, then fold and serve hot.",
    ),
  },
  {
    "id": "tr_13", "title": "Açaí Smoothie Bowl",
    "image": IMG("1490474418585-ba9bad8fd0ea"), "importCount": "4.1K",
    "sourcePlatform": "Instagram", "cuisine": "Brazilian", "category": "Breakfast",
    "servings": 1, "prepTime": 10, "cookTime": 0,
    "tags": ["smoothie","bowl","açaí","healthy","vegan"],
    "nutrition": {"calories": 420, "protein": 8, "carbs": 62, "fat": 16},
    "healthScore": 9,
    "ingredients": sec("Bowl",[
      ing("Frozen Açaí Puree","100","g","🫐"), ing("Frozen Banana","1","","🍌"),
      ing("Almond Milk","60","ml","🥛"), ing("Honey","1","tbsp","🍯"),
    ]) + sec("Toppings",[
      ing("Granola","3","tbsp","🌾"), ing("Banana","1/2","","🍌"),
      ing("Blueberries","1/4","cup","🫐"), ing("Coconut Flakes","1","tbsp","🥥"),
      ing("Chia Seeds","1","tsp","🖤"),
    ]),
    "steps": steps(
      "Blend frozen açaí, banana, and almond milk until thick and creamy.",
      "Pour into a bowl — the consistency should be thicker than a smoothie.",
      "Arrange toppings: granola, sliced banana, berries, and coconut flakes.",
      "Drizzle with honey and sprinkle chia seeds. Serve immediately.",
    ),
  },
  {
    "id": "tr_14", "title": "Shakshuka",
    "image": IMG("1482049016688-2d3e1b311543"), "importCount": "3.6K",
    "sourcePlatform": "Pinterest", "cuisine": "Middle Eastern", "category": "Breakfast",
    "servings": 2, "prepTime": 10, "cookTime": 20,
    "tags": ["eggs","tomato","middle eastern","brunch","healthy"],
    "nutrition": {"calories": 310, "protein": 18, "carbs": 22, "fat": 16},
    "healthScore": 8,
    "ingredients": sec("Sauce",[
      ing("Canned Crushed Tomatoes","400","g","🍅"), ing("Bell Pepper","1","","🫑"),
      ing("Onion","1","","🧅"), ing("Garlic","3","cloves","🧄"),
      ing("Cumin","1","tsp","🌿"), ing("Paprika","1","tsp","🌶️"),
      ing("Cayenne","1/4","tsp","🌶️"), ing("Olive Oil","2","tbsp","🫙"),
    ]) + sec("Eggs",[
      ing("Eggs","4","","🥚"), ing("Feta Cheese","50","g","🧀"),
      ing("Fresh Parsley","2","tbsp","🌿"),
    ]),
    "steps": steps(
      "Sauté diced onion and pepper in olive oil until soft.",
      "Add garlic and spices, cook for 1 minute until fragrant.",
      "Pour in crushed tomatoes, season, and simmer 10 minutes.",
      "Make wells in the sauce and crack eggs in. Cover and cook 6-8 min.",
      "Top with crumbled feta and fresh parsley. Serve with crusty bread.",
    ),
  },
  {
    "id": "tr_15", "title": "Overnight Chia Oats",
    "image": IMG("1608198093002-ad4e005484ec"), "importCount": "2.2K",
    "sourcePlatform": "Pinterest", "cuisine": "American", "category": "Breakfast",
    "servings": 1, "prepTime": 5, "cookTime": 0,
    "tags": ["oats","chia","no-cook","meal-prep","healthy"],
    "nutrition": {"calories": 350, "protein": 14, "carbs": 48, "fat": 12},
    "healthScore": 9,
    "ingredients": sec("Base",[
      ing("Rolled Oats","1/2","cup","🌾"), ing("Chia Seeds","1","tbsp","🖤"),
      ing("Almond Milk","1","cup","🥛"), ing("Honey","1","tbsp","🍯"),
      ing("Vanilla Extract","1/2","tsp","🍶"),
    ]) + sec("Toppings",[
      ing("Fresh Berries","1/4","cup","🍓"), ing("Almond Butter","1","tbsp","🥜"),
      ing("Sliced Banana","1/2","","🍌"),
    ]),
    "steps": steps(
      "Mix oats, chia seeds, almond milk, honey, and vanilla in a jar.",
      "Stir well to combine. Refrigerate overnight (at least 6 hours).",
      "In the morning, stir and add a splash of milk if too thick.",
      "Top with fresh berries, banana, and a dollop of almond butter.",
    ),
  },
  {
    "id": "tr_16", "title": "Mexican Breakfast Burrito",
    "image": IMG("1626700051175-6818013e1d4f"), "importCount": "3.3K",
    "sourcePlatform": "TikTok", "cuisine": "Mexican", "category": "Breakfast",
    "servings": 2, "prepTime": 10, "cookTime": 15,
    "tags": ["burrito","eggs","mexican","breakfast","high-protein"],
    "nutrition": {"calories": 580, "protein": 32, "carbs": 52, "fat": 26},
    "healthScore": 7,
    "ingredients": sec("Filling",[
      ing("Eggs","4","","🥚"), ing("Chorizo","100","g","🌶️"),
      ing("Black Beans","100","g","🫘"), ing("Cheddar Cheese","60","g","🧀"),
      ing("Salsa","3","tbsp","🍅"), ing("Avocado","1","","🥑"),
    ]) + sec("Wrap",[
      ing("Large Flour Tortillas","2","","🫓"), ing("Sour Cream","2","tbsp","🥄"),
      ing("Fresh Cilantro","2","tbsp","🌿"),
    ]),
    "steps": steps(
      "Cook chorizo in a pan until browned. Drain excess fat.",
      "Add beaten eggs and scramble with the chorizo.",
      "Warm tortillas and layer with eggs, beans, cheese, and salsa.",
      "Add sliced avocado and a dollop of sour cream.",
      "Roll tightly, slice in half, and serve hot.",
    ),
  },
  {
    "id": "tr_17", "title": "French Toast with Caramelized Bananas",
    "image": IMG("1484723091739-30a097e8f929"), "importCount": "2.9K",
    "sourcePlatform": "Instagram", "cuisine": "French", "category": "Breakfast",
    "servings": 2, "prepTime": 8, "cookTime": 12,
    "tags": ["french toast","banana","breakfast","sweet","brunch"],
    "nutrition": {"calories": 490, "protein": 15, "carbs": 68, "fat": 18},
    "healthScore": 6,
    "ingredients": sec("French Toast",[
      ing("Brioche Bread","4","slices","🍞"), ing("Eggs","2","","🥚"),
      ing("Milk","60","ml","🥛"), ing("Cinnamon","1","tsp","🌿"),
      ing("Vanilla","1","tsp","🍶"), ing("Butter","2","tbsp","🧈"),
    ]) + sec("Caramelized Bananas",[
      ing("Bananas","2","","🍌"), ing("Brown Sugar","2","tbsp","🟤"),
      ing("Butter","1","tbsp","🧈"), ing("Maple Syrup","2","tbsp","🍯"),
    ]),
    "steps": steps(
      "Whisk eggs, milk, cinnamon, and vanilla in a shallow bowl.",
      "Dip brioche slices into the egg mixture, coating both sides.",
      "Cook in butter over medium heat until golden on both sides.",
      "In a separate pan, melt butter with brown sugar and add sliced bananas.",
      "Cook bananas until caramelized, 3-4 minutes.",
      "Serve french toast topped with caramelized bananas and maple syrup.",
    ),
  },
  {
    "id": "tr_18", "title": "Congee (Chinese Rice Porridge)",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "1.9K",
    "sourcePlatform": "TikTok", "cuisine": "Chinese", "category": "Breakfast",
    "servings": 2, "prepTime": 5, "cookTime": 45,
    "tags": ["congee","chinese","comfort","rice","gluten-free"],
    "nutrition": {"calories": 280, "protein": 14, "carbs": 42, "fat": 5},
    "healthScore": 8,
    "ingredients": sec("Congee",[
      ing("Jasmine Rice","1/2","cup","🍚"), ing("Chicken Broth","1","L","🍲"),
      ing("Ginger","3","slices","🫚"), ing("Garlic","2","cloves","🧄"),
    ]) + sec("Toppings",[
      ing("Soft Boiled Egg","1","","🥚"), ing("Green Onion","2","stalks","🌿"),
      ing("Sesame Oil","1","tsp","🫙"), ing("Soy Sauce","1","tbsp","🫙"),
      ing("Crispy Shallots","2","tbsp","🧅"),
    ]),
    "steps": steps(
      "Rinse rice and combine with broth, ginger, and garlic in a pot.",
      "Bring to a boil, then reduce to a low simmer.",
      "Cook 40-45 minutes, stirring occasionally, until very creamy.",
      "Season with soy sauce and sesame oil.",
      "Top with soft-boiled egg, green onions, and crispy shallots.",
    ),
  },
  {
    "id": "tr_19", "title": "Avocado Egg Bake",
    "image": IMG("1525351484163-7529414344d8"), "importCount": "3.1K",
    "sourcePlatform": "Pinterest", "cuisine": "American", "category": "Breakfast",
    "servings": 2, "prepTime": 5, "cookTime": 15,
    "tags": ["avocado","egg","keto","low-carb","quick"],
    "nutrition": {"calories": 340, "protein": 16, "carbs": 10, "fat": 27},
    "healthScore": 9,
    "ingredients": sec("Bake",[
      ing("Avocados","2","","🥑"), ing("Eggs","2","","🥚"),
      ing("Cheddar","30","g","🧀"), ing("Red Pepper Flakes","1/2","tsp","🌶️"),
      ing("Salt & Pepper","to taste","","🧂"), ing("Chives","1","tbsp","🌿"),
    ]),
    "steps": steps(
      "Preheat oven to 200°C. Halve avocados and remove pits.",
      "Scoop out a little flesh to make room for the egg.",
      "Place avocados in a baking dish. Crack one egg into each half.",
      "Season with salt, pepper, and red pepper flakes.",
      "Bake 12-15 minutes until whites are set. Top with cheese and chives.",
    ),
  },
  {
    "id": "tr_20", "title": "Idli Sambar",
    "image": IMG("1534422298391-e4f8c172dddb"), "importCount": "2.4K",
    "sourcePlatform": "Instagram", "cuisine": "Indian", "category": "Breakfast",
    "servings": 3, "prepTime": 10, "cookTime": 30,
    "tags": ["idli","sambar","indian","south indian","healthy","vegan"],
    "nutrition": {"calories": 310, "protein": 11, "carbs": 55, "fat": 6},
    "healthScore": 9,
    "ingredients": sec("Idli",[
      ing("Idli Batter (store-bought)","2","cups","🍚"), ing("Salt","1","tsp","🧂"),
    ]) + sec("Sambar",[
      ing("Toor Dal","1/2","cup","🫘"), ing("Tomatoes","2","","🍅"),
      ing("Onion","1","","🧅"), ing("Sambar Powder","2","tsp","🌿"),
      ing("Tamarind Paste","1","tsp","🫙"), ing("Mustard Seeds","1","tsp","🌿"),
      ing("Curry Leaves","8","","🌿"),
    ]),
    "steps": steps(
      "Steam idli batter in greased molds for 10-12 minutes.",
      "Boil dal until soft. Add tomatoes, onion, and sambar powder.",
      "Add tamarind paste and simmer 10 minutes.",
      "Temper with mustard seeds and curry leaves in oil.",
      "Serve hot idlis with sambar and coconut chutney.",
    ),
  },
  # ---- LUNCH --------------------------------------------------------------
  {
    "id": "tr_21", "title": "Bánh Mì Sandwich",
    "image": IMG("1563379926898-05f4575a45d8"), "importCount": "3.8K",
    "sourcePlatform": "TikTok", "cuisine": "Vietnamese", "category": "Lunch",
    "servings": 2, "prepTime": 20, "cookTime": 10,
    "tags": ["vietnamese","sandwich","pork","fresh","banh mi"],
    "nutrition": {"calories": 480, "protein": 28, "carbs": 52, "fat": 18},
    "healthScore": 7,
    "ingredients": sec("Filling",[
      ing("Pork Belly","300","g","🥩"), ing("Soy Sauce","2","tbsp","🫙"),
      ing("Fish Sauce","1","tbsp","🫙"), ing("Garlic","3","cloves","🧄"),
      ing("Sugar","1","tbsp","🍚"),
    ]) + sec("Assembly",[
      ing("Baguette","1","","🥖"), ing("Pickled Daikon & Carrot","1/2","cup","🥕"),
      ing("Cucumber","1/2","","🥒"), ing("Jalapeño","1","","🌶️"),
      ing("Cilantro","1/4","cup","🌿"), ing("Mayo","2","tbsp","🥄"),
      ing("Pâté","2","tbsp","🥄"),
    ]),
    "steps": steps(
      "Marinate pork in soy sauce, fish sauce, garlic, and sugar for 30 min.",
      "Cook pork in a hot pan until caramelized and cooked through.",
      "Slice baguette and spread with pâté and mayo.",
      "Layer with pork, pickled vegetables, cucumber, and jalapeño.",
      "Top with fresh cilantro and serve immediately.",
    ),
  },
  {
    "id": "tr_22", "title": "Pad Thai",
    "image": IMG("1555939594-58d7cb561ad1"), "importCount": "4.7K",
    "sourcePlatform": "TikTok", "cuisine": "Thai", "category": "Lunch",
    "servings": 2, "prepTime": 15, "cookTime": 15,
    "tags": ["thai","noodles","pad thai","classic","shrimp"],
    "nutrition": {"calories": 540, "protein": 28, "carbs": 68, "fat": 18},
    "healthScore": 7,
    "ingredients": sec("Noodles & Protein",[
      ing("Rice Noodles","200","g","🍜"), ing("Shrimp","200","g","🦐"),
      ing("Eggs","2","","🥚"), ing("Tofu (firm)","100","g","🟡"),
    ]) + sec("Sauce",[
      ing("Fish Sauce","3","tbsp","🫙"), ing("Tamarind Paste","2","tbsp","🫙"),
      ing("Sugar","1","tbsp","🍚"), ing("Oyster Sauce","1","tbsp","🫙"),
    ]) + sec("Garnish",[
      ing("Bean Sprouts","1","cup","🌱"), ing("Green Onions","3","","🌿"),
      ing("Crushed Peanuts","3","tbsp","🥜"), ing("Lime","1","","🍋"),
      ing("Dried Chilli","1","tsp","🌶️"),
    ]),
    "steps": steps(
      "Soak noodles in warm water 20 minutes until softened.",
      "Mix sauce ingredients in a bowl.",
      "Stir-fry shrimp and tofu in a hot wok with oil.",
      "Add noodles and sauce, toss over high heat.",
      "Push to side, scramble eggs, then mix everything together.",
      "Serve topped with bean sprouts, peanuts, and lime.",
    ),
  },
  {
    "id": "tr_23", "title": "Caprese Salad",
    "image": IMG("1512621776951-a57141f2eefd"), "importCount": "2.1K",
    "sourcePlatform": "Pinterest", "cuisine": "Italian", "category": "Lunch",
    "servings": 2, "prepTime": 10, "cookTime": 0,
    "tags": ["italian","salad","caprese","vegetarian","fresh"],
    "nutrition": {"calories": 320, "protein": 18, "carbs": 12, "fat": 22},
    "healthScore": 9,
    "ingredients": sec("Salad",[
      ing("Fresh Mozzarella","250","g","🧀"), ing("Heirloom Tomatoes","3","","🍅"),
      ing("Fresh Basil","20","leaves","🌿"), ing("Extra Virgin Olive Oil","3","tbsp","🫙"),
      ing("Balsamic Glaze","2","tbsp","🫙"), ing("Flaky Sea Salt","to taste","","🧂"),
      ing("Black Pepper","to taste","","🖤"),
    ]),
    "steps": steps(
      "Slice mozzarella and tomatoes to the same thickness.",
      "Alternate tomato and mozzarella slices on a platter.",
      "Tuck basil leaves between each slice.",
      "Drizzle generously with olive oil and balsamic glaze.",
      "Season with sea salt and pepper. Serve immediately.",
    ),
  },
  {
    "id": "tr_24", "title": "Spicy Tuna Poke Bowl",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "5.6K",
    "sourcePlatform": "Instagram", "cuisine": "Hawaiian", "category": "Lunch",
    "servings": 2, "prepTime": 20, "cookTime": 20,
    "tags": ["poke","tuna","bowl","japanese","healthy","rice"],
    "nutrition": {"calories": 510, "protein": 38, "carbs": 52, "fat": 16},
    "healthScore": 9,
    "ingredients": sec("Poke",[
      ing("Sushi-Grade Tuna","300","g","🐟"), ing("Soy Sauce","3","tbsp","🫙"),
      ing("Sesame Oil","1","tbsp","🫙"), ing("Sriracha","1","tbsp","🌶️"),
      ing("Green Onion","2","","🌿"), ing("Sesame Seeds","1","tbsp","🖤"),
    ]) + sec("Bowl",[
      ing("Sushi Rice","1.5","cups","🍚"), ing("Edamame","1/2","cup","🫘"),
      ing("Cucumber","1/2","","🥒"), ing("Avocado","1","","🥑"),
      ing("Pickled Ginger","2","tbsp","🌸"), ing("Nori Strips","to taste","","🟤"),
    ]),
    "steps": steps(
      "Cook sushi rice and season with rice vinegar, sugar, and salt.",
      "Dice tuna into cubes. Mix with soy sauce, sesame oil, and sriracha.",
      "Add green onion and sesame seeds to the tuna. Refrigerate.",
      "Divide rice into bowls. Arrange tuna, edamame, cucumber, and avocado.",
      "Top with pickled ginger, nori, and extra sesame seeds.",
    ),
  },
  {
    "id": "tr_25", "title": "Chicken Caesar Salad",
    "image": IMG("1512621776951-a57141f2eefd"), "importCount": "3.2K",
    "sourcePlatform": "Instagram", "cuisine": "American", "category": "Lunch",
    "servings": 2, "prepTime": 15, "cookTime": 15,
    "tags": ["caesar","salad","chicken","classic","high-protein"],
    "nutrition": {"calories": 480, "protein": 42, "carbs": 18, "fat": 26},
    "healthScore": 8,
    "ingredients": sec("Chicken",[
      ing("Chicken Breast","400","g","🍗"), ing("Olive Oil","2","tbsp","🫙"),
      ing("Garlic Powder","1","tsp","🧄"), ing("Italian Seasoning","1","tsp","🌿"),
    ]) + sec("Salad",[
      ing("Romaine Lettuce","1","head","🥬"), ing("Parmesan","60","g","🧀"),
      ing("Croutons","1","cup","🍞"), ing("Caesar Dressing","4","tbsp","🥄"),
      ing("Lemon","1","","🍋"), ing("Black Pepper","to taste","","🖤"),
    ]),
    "steps": steps(
      "Season chicken with olive oil, garlic powder, and Italian seasoning.",
      "Grill or pan-sear chicken 6-7 min per side until cooked through.",
      "Rest chicken 5 minutes, then slice thinly.",
      "Tear romaine into a large bowl. Add croutons and parmesan.",
      "Toss with caesar dressing. Top with sliced chicken and extra parmesan.",
    ),
  },
  {
    "id": "tr_26", "title": "Tom Yum Soup",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "2.7K",
    "sourcePlatform": "TikTok", "cuisine": "Thai", "category": "Lunch",
    "servings": 2, "prepTime": 10, "cookTime": 20,
    "tags": ["soup","thai","spicy","shrimp","low-calorie"],
    "nutrition": {"calories": 220, "protein": 24, "carbs": 18, "fat": 6},
    "healthScore": 9,
    "ingredients": sec("Soup",[
      ing("Shrimp","300","g","🦐"), ing("Lemongrass","2","stalks","🌿"),
      ing("Galangal","4","slices","🫚"), ing("Kaffir Lime Leaves","4","","🌿"),
      ing("Thai Chilies","3","","🌶️"), ing("Fish Sauce","3","tbsp","🫙"),
      ing("Lime Juice","3","tbsp","🍋"), ing("Mushrooms","150","g","🍄"),
      ing("Coconut Milk","200","ml","🥥"), ing("Chicken Broth","500","ml","🍲"),
    ]),
    "steps": steps(
      "Bruise lemongrass, galangal, and kaffir lime leaves.",
      "Simmer broth with aromatics for 10 minutes.",
      "Add mushrooms and cook 3 minutes.",
      "Add shrimp and chilies. Cook until shrimp turns pink.",
      "Stir in coconut milk, fish sauce, and lime juice. Adjust seasoning.",
      "Serve hot with fresh chilies and lime wedges.",
    ),
  },
  {
    "id": "tr_27", "title": "Falafel Wrap",
    "image": IMG("1626700051175-6818013e1d4f"), "importCount": "3.0K",
    "sourcePlatform": "Pinterest", "cuisine": "Middle Eastern", "category": "Lunch",
    "servings": 2, "prepTime": 20, "cookTime": 15,
    "tags": ["falafel","wrap","middle eastern","vegan","protein"],
    "nutrition": {"calories": 460, "protein": 18, "carbs": 62, "fat": 16},
    "healthScore": 8,
    "ingredients": sec("Falafel",[
      ing("Canned Chickpeas","400","g","🫘"), ing("Onion","1/2","","🧅"),
      ing("Garlic","3","cloves","🧄"), ing("Cumin","1","tsp","🌿"),
      ing("Coriander Powder","1","tsp","🌿"), ing("Parsley","1/4","cup","🌿"),
      ing("Flour","3","tbsp","🌾"),
    ]) + sec("Assembly",[
      ing("Pita Bread","2","","🫓"), ing("Hummus","4","tbsp","🥣"),
      ing("Lettuce","4","leaves","🥬"), ing("Tomato","1","","🍅"),
      ing("Tahini Sauce","2","tbsp","🥄"), ing("Pickled Cucumber","4","slices","🥒"),
    ]),
    "steps": steps(
      "Blend chickpeas, onion, garlic, herbs, and spices until coarse.",
      "Form into small patties or balls. Refrigerate 30 minutes.",
      "Pan-fry or bake at 200°C for 15-20 minutes until golden.",
      "Warm pita and spread with hummus.",
      "Add falafel, vegetables, and drizzle with tahini. Wrap and serve.",
    ),
  },
  {
    "id": "tr_28", "title": "Smash Burger",
    "image": IMG("1563379926898-05f4575a45d8"), "importCount": "6.2K",
    "sourcePlatform": "TikTok", "cuisine": "American", "category": "Lunch",
    "servings": 2, "prepTime": 10, "cookTime": 10,
    "tags": ["burger","smash","beef","american","quick"],
    "nutrition": {"calories": 680, "protein": 38, "carbs": 42, "fat": 38},
    "healthScore": 5,
    "ingredients": sec("Burger",[
      ing("Ground Beef (80/20)","300","g","🥩"), ing("American Cheese","2","slices","🧀"),
      ing("Brioche Buns","2","","🍞"), ing("Butter","1","tbsp","🧈"),
      ing("Salt & Pepper","to taste","","🧂"),
    ]) + sec("Toppings",[
      ing("Iceberg Lettuce","2","leaves","🥬"), ing("Tomato","1","","🍅"),
      ing("Pickles","6","slices","🥒"), ing("Yellow Mustard","1","tbsp","🟡"),
      ing("Ketchup","2","tbsp","🍅"), ing("Mayonnaise","2","tbsp","🥄"),
    ]),
    "steps": steps(
      "Divide beef into 2 balls, season generously with salt and pepper.",
      "Heat a cast iron pan until smoking hot. Add butter.",
      "Place beef ball and smash flat immediately with a spatula.",
      "Cook 2 min, flip, add cheese, cook 1 more minute.",
      "Toast buns in the same pan. Assemble with all toppings.",
    ),
  },
  {
    "id": "tr_29", "title": "Miso Soup with Tofu",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "1.8K",
    "sourcePlatform": "Pinterest", "cuisine": "Japanese", "category": "Lunch",
    "servings": 2, "prepTime": 5, "cookTime": 10,
    "tags": ["miso","soup","japanese","tofu","vegan","low-calorie"],
    "nutrition": {"calories": 140, "protein": 10, "carbs": 14, "fat": 5},
    "healthScore": 10,
    "ingredients": sec("Soup",[
      ing("Dashi Stock","500","ml","🍲"), ing("White Miso Paste","3","tbsp","🥣"),
      ing("Silken Tofu","150","g","🟡"), ing("Wakame Seaweed","1","tbsp","🌿"),
      ing("Green Onion","2","stalks","🌿"),
    ]),
    "steps": steps(
      "Heat dashi stock until just below boiling.",
      "Dissolve miso paste in a ladle of warm broth, then add back to pot.",
      "Add cubed tofu and rehydrated wakame.",
      "Simmer gently 2-3 minutes — never boil after adding miso.",
      "Serve in bowls topped with sliced green onion.",
    ),
  },
  {
    "id": "tr_30", "title": "Quesadillas",
    "image": IMG("1626700051175-6818013e1d4f"), "importCount": "3.5K",
    "sourcePlatform": "TikTok", "cuisine": "Mexican", "category": "Lunch",
    "servings": 2, "prepTime": 10, "cookTime": 10,
    "tags": ["quesadilla","mexican","cheese","quick","kids"],
    "nutrition": {"calories": 520, "protein": 28, "carbs": 44, "fat": 26},
    "healthScore": 7,
    "ingredients": sec("Filling",[
      ing("Chicken Breast","300","g","🍗"), ing("Cheddar Cheese","150","g","🧀"),
      ing("Bell Peppers","2","","🫑"), ing("Onion","1","","🧅"),
      ing("Cumin","1","tsp","🌿"), ing("Smoked Paprika","1","tsp","🌶️"),
    ]) + sec("Assembly",[
      ing("Large Flour Tortillas","4","","🫓"), ing("Sour Cream","to serve","","🥄"),
      ing("Salsa","to serve","","🍅"), ing("Guacamole","to serve","","🥑"),
    ]),
    "steps": steps(
      "Season and cook chicken, then slice into strips.",
      "Sauté peppers and onions with cumin and paprika.",
      "Layer chicken, vegetables, and cheese on half a tortilla. Fold.",
      "Cook in a dry pan 2-3 min per side until golden and cheese melts.",
      "Cut into wedges. Serve with sour cream, salsa, and guacamole.",
    ),
  },
  # ---- DINNER -------------------------------------------------------------
  {
    "id": "tr_31", "title": "Butter Chicken (Murgh Makhani)",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "7.8K",
    "sourcePlatform": "TikTok", "cuisine": "Indian", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 35,
    "tags": ["indian","curry","chicken","butter chicken","popular"],
    "nutrition": {"calories": 480, "protein": 38, "carbs": 22, "fat": 28},
    "healthScore": 7,
    "ingredients": sec("Chicken Marinade",[
      ing("Chicken Thighs","700","g","🍗"), ing("Yogurt","1/2","cup","🥛"),
      ing("Garam Masala","2","tsp","🌿"), ing("Turmeric","1","tsp","🟡"),
      ing("Chili Powder","1","tsp","🌶️"), ing("Ginger-Garlic Paste","2","tbsp","🧄"),
    ]) + sec("Makhani Sauce",[
      ing("Butter","3","tbsp","🧈"), ing("Onion","2","","🧅"),
      ing("Tomatoes","4","","🍅"), ing("Heavy Cream","200","ml","🥛"),
      ing("Kashmiri Chili","1","tsp","🌶️"), ing("Fenugreek Leaves","1","tsp","🌿"),
      ing("Sugar","1","tsp","🍚"),
    ]),
    "steps": steps(
      "Marinate chicken in yogurt and spices at least 2 hours.",
      "Grill or broil chicken until charred. Set aside.",
      "Sauté onions in butter until golden, add tomatoes and spices.",
      "Blend sauce until smooth, then return to pan.",
      "Add cream and chicken. Simmer 15 minutes until rich.",
      "Finish with fenugreek leaves and serve with naan or basmati rice.",
    ),
  },
  {
    "id": "tr_32", "title": "Spaghetti Carbonara",
    "image": IMG("1621996346565-e3dbc646d9a9"), "importCount": "5.4K",
    "sourcePlatform": "TikTok", "cuisine": "Italian", "category": "Dinner",
    "servings": 2, "prepTime": 10, "cookTime": 20,
    "tags": ["pasta","italian","carbonara","classic","quick"],
    "nutrition": {"calories": 620, "protein": 32, "carbs": 72, "fat": 22},
    "healthScore": 6,
    "ingredients": sec("Pasta",[
      ing("Spaghetti","200","g","🍝"), ing("Guanciale or Pancetta","100","g","🥩"),
      ing("Eggs","2","","🥚"), ing("Egg Yolks","2","","🥚"),
      ing("Pecorino Romano","80","g","🧀"), ing("Parmesan","40","g","🧀"),
      ing("Black Pepper","2","tsp","🖤"),
    ]),
    "steps": steps(
      "Cook spaghetti in well-salted boiling water until al dente.",
      "Fry guanciale over medium heat until crispy. Remove from heat.",
      "Whisk eggs, yolks, and grated cheese with plenty of black pepper.",
      "Reserve 1 cup pasta water. Drain spaghetti.",
      "Off heat, toss pasta with guanciale fat, then add egg mixture.",
      "Add pasta water gradually to create a creamy sauce. Serve immediately.",
    ),
  },
  {
    "id": "tr_33", "title": "Birria Tacos",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "8.3K",
    "sourcePlatform": "TikTok", "cuisine": "Mexican", "category": "Dinner",
    "servings": 6, "prepTime": 30, "cookTime": 180,
    "tags": ["tacos","birria","mexican","beef","trending"],
    "nutrition": {"calories": 420, "protein": 32, "carbs": 28, "fat": 22},
    "healthScore": 7,
    "ingredients": sec("Birria",[
      ing("Beef Chuck","1","kg","🥩"), ing("Dried Guajillo Chilies","4","","🌶️"),
      ing("Dried Ancho Chilies","2","","🌶️"), ing("Tomatoes","3","","🍅"),
      ing("Onion","1","","🧅"), ing("Garlic","6","cloves","🧄"),
      ing("Cumin","2","tsp","🌿"), ing("Oregano","1","tsp","🌿"),
      ing("Cinnamon","1","stick","🌿"), ing("Bay Leaves","2","","🌿"),
    ]) + sec("Assembly",[
      ing("Corn Tortillas","12","","🫓"), ing("Oaxaca Cheese","200","g","🧀"),
      ing("Onion (diced)","1","","🧅"), ing("Cilantro","1/2","cup","🌿"),
      ing("Lime","2","","🍋"),
    ]),
    "steps": steps(
      "Toast and rehydrate chilies. Blend with tomatoes, garlic, and spices.",
      "Sear beef until browned. Add chili sauce and enough water to cover.",
      "Braise covered at 160°C for 3 hours until fork tender.",
      "Shred beef and reserve the broth (consomé) for dipping.",
      "Dip tortillas in consomé, add cheese and beef, fold and fry until crispy.",
      "Serve with diced onion, cilantro, lime, and consomé for dipping.",
    ),
  },
  {
    "id": "tr_34", "title": "Teriyaki Salmon Bowl",
    "image": IMG("1467003909585-2f8a72700288"), "importCount": "4.2K",
    "sourcePlatform": "Instagram", "cuisine": "Japanese", "category": "Dinner",
    "servings": 2, "prepTime": 10, "cookTime": 15,
    "tags": ["salmon","teriyaki","japanese","bowl","healthy","omega-3"],
    "nutrition": {"calories": 520, "protein": 42, "carbs": 48, "fat": 18},
    "healthScore": 9,
    "ingredients": sec("Teriyaki Salmon",[
      ing("Salmon Fillets","400","g","🐟"), ing("Soy Sauce","3","tbsp","🫙"),
      ing("Mirin","2","tbsp","🫙"), ing("Sake","1","tbsp","🍶"),
      ing("Sugar","1","tbsp","🍚"), ing("Sesame Oil","1","tsp","🫙"),
    ]) + sec("Bowl",[
      ing("Steamed Rice","2","cups","🍚"), ing("Edamame","1/2","cup","🫘"),
      ing("Cucumber","1","","🥒"), ing("Avocado","1","","🥑"),
      ing("Sesame Seeds","1","tbsp","🖤"), ing("Green Onion","2","stalks","🌿"),
    ]),
    "steps": steps(
      "Mix soy sauce, mirin, sake, and sugar for the teriyaki sauce.",
      "Marinate salmon in half the sauce for 20 minutes.",
      "Pan sear salmon 3-4 min per side, add remaining sauce to glaze.",
      "Prepare bowls with steamed rice as the base.",
      "Add salmon, cucumber, avocado, and edamame.",
      "Drizzle with remaining glaze. Top with sesame seeds and green onion.",
    ),
  },
  {
    "id": "tr_35", "title": "Dal Makhani",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "3.1K",
    "sourcePlatform": "Pinterest", "cuisine": "Indian", "category": "Dinner",
    "servings": 4, "prepTime": 10, "cookTime": 60,
    "tags": ["dal","lentils","indian","vegetarian","comfort"],
    "nutrition": {"calories": 380, "protein": 16, "carbs": 48, "fat": 14},
    "healthScore": 8,
    "ingredients": sec("Dal",[
      ing("Black Lentils (urad dal)","200","g","🫘"), ing("Kidney Beans","100","g","🫘"),
      ing("Butter","3","tbsp","🧈"), ing("Onion","2","","🧅"),
      ing("Garlic-Ginger Paste","2","tbsp","🧄"), ing("Tomatoes","3","","🍅"),
      ing("Cream","100","ml","🥛"), ing("Garam Masala","1","tsp","🌿"),
      ing("Cumin","1","tsp","🌿"),
    ]),
    "steps": steps(
      "Soak lentils and beans overnight. Pressure cook until soft.",
      "Sauté onions in butter until golden. Add garlic-ginger paste.",
      "Add tomatoes and spices, cook until oil separates.",
      "Add cooked lentils and beans. Simmer on low heat 30 minutes.",
      "Stir in cream and butter. Cook another 10 minutes.",
      "Serve with naan or rice, garnished with cream and coriander.",
    ),
  },
  {
    "id": "tr_36", "title": "Chicken Tikka Masala",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "6.5K",
    "sourcePlatform": "TikTok", "cuisine": "Indian", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 30,
    "tags": ["indian","curry","chicken","tikka","popular","spicy"],
    "nutrition": {"calories": 490, "protein": 40, "carbs": 24, "fat": 26},
    "healthScore": 7,
    "ingredients": sec("Chicken",[
      ing("Chicken Breast","700","g","🍗"), ing("Yogurt","1/2","cup","🥛"),
      ing("Tikka Masala Powder","2","tbsp","🌿"), ing("Lemon Juice","1","tbsp","🍋"),
    ]) + sec("Sauce",[
      ing("Oil","2","tbsp","🫙"), ing("Onion","2","","🧅"),
      ing("Garlic","4","cloves","🧄"), ing("Ginger","1","tbsp","🫚"),
      ing("Crushed Tomatoes","400","g","🍅"), ing("Heavy Cream","200","ml","🥛"),
      ing("Garam Masala","2","tsp","🌿"),
    ]),
    "steps": steps(
      "Marinate chicken in yogurt, tikka powder, and lemon juice.",
      "Grill or broil chicken until lightly charred.",
      "Sauté onion, garlic, and ginger in oil until golden.",
      "Add tomatoes and garam masala, simmer 10 minutes.",
      "Add cream and grilled chicken. Simmer 10 more minutes.",
      "Serve with basmati rice and warm naan bread.",
    ),
  },
  {
    "id": "tr_37", "title": "Kung Pao Chicken",
    "image": IMG("1604908176997-125f25cc6f3d"), "importCount": "4.4K",
    "sourcePlatform": "TikTok", "cuisine": "Chinese", "category": "Dinner",
    "servings": 3, "prepTime": 15, "cookTime": 15,
    "tags": ["chinese","chicken","spicy","stir-fry","peanuts"],
    "nutrition": {"calories": 420, "protein": 35, "carbs": 22, "fat": 22},
    "healthScore": 7,
    "ingredients": sec("Chicken",[
      ing("Chicken Breast","500","g","🍗"), ing("Soy Sauce","2","tbsp","🫙"),
      ing("Shaoxing Wine","1","tbsp","🍶"), ing("Cornstarch","1","tbsp","🌾"),
    ]) + sec("Stir Fry",[
      ing("Dried Red Chilies","6","","🌶️"), ing("Sichuan Peppercorns","1","tsp","🌿"),
      ing("Roasted Peanuts","1/2","cup","🥜"), ing("Green Onion","4","","🌿"),
      ing("Garlic","3","cloves","🧄"), ing("Ginger","1","tbsp","🫚"),
    ]) + sec("Sauce",[
      ing("Soy Sauce","2","tbsp","🫙"), ing("Black Vinegar","1","tbsp","🫙"),
      ing("Sugar","1","tbsp","🍚"), ing("Sesame Oil","1","tsp","🫙"),
    ]),
    "steps": steps(
      "Dice chicken and marinate in soy sauce, wine, and cornstarch.",
      "Mix sauce ingredients in a bowl.",
      "Stir-fry chilies and peppercorns in hot oil until fragrant.",
      "Add chicken and cook until golden.",
      "Add garlic, ginger, and sauce. Toss until coated.",
      "Stir in peanuts and green onion. Serve with steamed rice.",
    ),
  },
  {
    "id": "tr_38", "title": "Ratatouille",
    "image": IMG("1512621776951-a57141f2eefd"), "importCount": "2.5K",
    "sourcePlatform": "Pinterest", "cuisine": "French", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 45,
    "tags": ["french","vegetarian","ratatouille","vegetables","vegan"],
    "nutrition": {"calories": 180, "protein": 5, "carbs": 24, "fat": 8},
    "healthScore": 10,
    "ingredients": sec("Vegetables",[
      ing("Zucchini","2","","🥒"), ing("Eggplant","1","","🍆"),
      ing("Yellow Squash","1","","🟡"), ing("Tomatoes","4","","🍅"),
      ing("Red Bell Pepper","2","","🫑"), ing("Garlic","4","cloves","🧄"),
      ing("Fresh Thyme","4","sprigs","🌿"), ing("Olive Oil","4","tbsp","🫙"),
    ]) + sec("Tomato Sauce",[
      ing("Crushed Tomatoes","400","g","🍅"), ing("Onion","1","","🧅"),
      ing("Garlic","2","cloves","🧄"), ing("Herbs de Provence","1","tsp","🌿"),
    ]),
    "steps": steps(
      "Make tomato sauce: sauté onion and garlic, add crushed tomatoes and herbs.",
      "Spread sauce in a baking dish.",
      "Slice all vegetables thinly on a mandoline.",
      "Arrange alternating vegetable slices overlapping on the sauce.",
      "Drizzle with olive oil, add thyme and garlic, season well.",
      "Cover with parchment and bake 45 min at 180°C. Uncover last 15 min.",
    ),
  },
  {
    "id": "tr_39", "title": "Lamb Kofta with Tzatziki",
    "image": IMG("1466637574441-749b8f19452f"), "importCount": "3.3K",
    "sourcePlatform": "Instagram", "cuisine": "Mediterranean", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 15,
    "tags": ["lamb","kofta","mediterranean","greek","high-protein"],
    "nutrition": {"calories": 440, "protein": 32, "carbs": 20, "fat": 26},
    "healthScore": 7,
    "ingredients": sec("Kofta",[
      ing("Ground Lamb","500","g","🥩"), ing("Onion","1/2","","🧅"),
      ing("Garlic","3","cloves","🧄"), ing("Cumin","2","tsp","🌿"),
      ing("Coriander","1","tsp","🌿"), ing("Cinnamon","1/2","tsp","🌿"),
      ing("Fresh Parsley","3","tbsp","🌿"), ing("Salt & Pepper","to taste","","🧂"),
    ]) + sec("Tzatziki",[
      ing("Greek Yogurt","1","cup","🥛"), ing("Cucumber","1/2","","🥒"),
      ing("Garlic","1","clove","🧄"), ing("Dill","1","tbsp","🌿"),
      ing("Lemon Juice","1","tbsp","🍋"), ing("Olive Oil","1","tbsp","🫙"),
    ]),
    "steps": steps(
      "Mix lamb with all kofta spices, onion, and parsley.",
      "Shape around skewers into long cylinders.",
      "Grill over high heat, turning, until cooked through (~12 min).",
      "Grate cucumber, squeeze out water, mix with yogurt and garlic.",
      "Add dill, lemon, and olive oil to tzatziki. Season well.",
      "Serve kofta with tzatziki, warm pita, and salad.",
    ),
  },
  {
    "id": "tr_40", "title": "Mapo Tofu",
    "image": IMG("1604908176997-125f25cc6f3d"), "importCount": "3.8K",
    "sourcePlatform": "TikTok", "cuisine": "Chinese", "category": "Dinner",
    "servings": 2, "prepTime": 10, "cookTime": 15,
    "tags": ["chinese","tofu","sichuan","spicy","numbing"],
    "nutrition": {"calories": 340, "protein": 20, "carbs": 16, "fat": 22},
    "healthScore": 8,
    "ingredients": sec("Main",[
      ing("Silken Tofu","400","g","🟡"), ing("Ground Pork","150","g","🥩"),
      ing("Doubanjiang (chili bean paste)","2","tbsp","🌶️"),
      ing("Sichuan Peppercorns","1","tsp","🌿"), ing("Garlic","3","cloves","🧄"),
      ing("Ginger","1","tbsp","🫚"), ing("Chicken Broth","150","ml","🍲"),
      ing("Soy Sauce","1","tbsp","🫙"), ing("Sesame Oil","1","tsp","🫙"),
      ing("Cornstarch","1","tbsp","🌾"), ing("Green Onion","3","","🌿"),
    ]),
    "steps": steps(
      "Cut tofu into cubes. Toast Sichuan peppercorns and grind.",
      "Brown pork in oil. Add doubanjiang and cook until fragrant.",
      "Add garlic and ginger. Pour in broth and soy sauce.",
      "Gently add tofu. Simmer 5 minutes without breaking it up.",
      "Thicken with cornstarch slurry. Add sesame oil and peppercorn powder.",
      "Serve over rice, topped with green onion.",
    ),
  },
  {
    "id": "tr_41", "title": "Osso Buco",
    "image": IMG("1507048331197-7d4ac70811cf"), "importCount": "2.1K",
    "sourcePlatform": "Pinterest", "cuisine": "Italian", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 120,
    "tags": ["italian","veal","braised","osso buco","classic","dinner party"],
    "nutrition": {"calories": 560, "protein": 42, "carbs": 18, "fat": 34},
    "healthScore": 7,
    "ingredients": sec("Osso Buco",[
      ing("Veal Shanks","4","","🥩"), ing("All-Purpose Flour","1/2","cup","🌾"),
      ing("Olive Oil","4","tbsp","🫙"), ing("Onion","1","","🧅"),
      ing("Carrots","2","","🥕"), ing("Celery","2","stalks","🌿"),
      ing("Garlic","4","cloves","🧄"), ing("White Wine","1","cup","🍷"),
      ing("Chicken Broth","500","ml","🍲"), ing("Crushed Tomatoes","200","g","🍅"),
    ]) + sec("Gremolata",[
      ing("Lemon Zest","1","","🍋"), ing("Garlic","1","clove","🧄"),
      ing("Parsley","3","tbsp","🌿"),
    ]),
    "steps": steps(
      "Dust veal shanks in flour. Sear in hot oil until golden on all sides.",
      "Sauté onion, carrot, and celery in the same pot.",
      "Deglaze with white wine, scraping up the bits.",
      "Add broth and tomatoes. Return shanks. Cover and braise 2 hours at 160°C.",
      "Mix gremolata: lemon zest, garlic, and parsley.",
      "Serve shanks over risotto milanese, topped with gremolata.",
    ),
  },
  {
    "id": "tr_42", "title": "Carne Asada Tacos",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "5.1K",
    "sourcePlatform": "TikTok", "cuisine": "Mexican", "category": "Dinner",
    "servings": 4, "prepTime": 15, "cookTime": 15,
    "tags": ["tacos","carne asada","mexican","beef","grilled"],
    "nutrition": {"calories": 420, "protein": 30, "carbs": 32, "fat": 18},
    "healthScore": 7,
    "ingredients": sec("Carne Asada",[
      ing("Skirt Steak","600","g","🥩"), ing("Lime Juice","3","tbsp","🍋"),
      ing("Orange Juice","2","tbsp","🍊"), ing("Garlic","4","cloves","🧄"),
      ing("Cumin","2","tsp","🌿"), ing("Chili Powder","1","tsp","🌶️"),
      ing("Cilantro","1/4","cup","🌿"), ing("Olive Oil","2","tbsp","🫙"),
    ]) + sec("Assembly",[
      ing("Corn Tortillas","12","","🫓"), ing("White Onion","1","","🧅"),
      ing("Cilantro","1/2","cup","🌿"), ing("Salsa Verde","to serve","","🍅"),
      ing("Lime Wedges","2","","🍋"),
    ]),
    "steps": steps(
      "Combine lime, orange juice, garlic, spices, and cilantro for marinade.",
      "Marinate steak at least 1 hour (overnight is best).",
      "Grill over very high heat 4-5 min per side for medium rare.",
      "Rest 10 minutes, then chop into small pieces.",
      "Warm tortillas on the grill. Double up for each taco.",
      "Fill with carne asada, onion, cilantro, and salsa verde.",
    ),
  },
  {
    "id": "tr_43", "title": "Beef Bulgogi",
    "image": IMG("1553163147-622ab57be1c7"), "importCount": "4.6K",
    "sourcePlatform": "TikTok", "cuisine": "Korean", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 10,
    "tags": ["korean","beef","bulgogi","bbq","sweet","savory"],
    "nutrition": {"calories": 440, "protein": 36, "carbs": 28, "fat": 20},
    "healthScore": 7,
    "ingredients": sec("Bulgogi",[
      ing("Beef Sirloin","600","g","🥩"), ing("Soy Sauce","4","tbsp","🫙"),
      ing("Pear (grated)","1/2","","🍐"), ing("Garlic","4","cloves","🧄"),
      ing("Sesame Oil","2","tbsp","🫙"), ing("Sugar","2","tbsp","🍚"),
      ing("Ginger","1","tbsp","🫚"), ing("Green Onion","4","","🌿"),
      ing("Sesame Seeds","2","tbsp","🖤"),
    ]),
    "steps": steps(
      "Slice beef very thin — easier if partially frozen.",
      "Mix all marinade ingredients. Add beef and marinate 30 min minimum.",
      "Heat a grill pan or grill to very high heat.",
      "Cook beef in batches — don't overcrowd. 2-3 min total.",
      "Serve over steamed rice with kimchi and banchan sides.",
    ),
  },
  {
    "id": "tr_44", "title": "Lobster Bisque",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "2.8K",
    "sourcePlatform": "Pinterest", "cuisine": "French", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 40,
    "tags": ["lobster","bisque","french","soup","seafood","special occasion"],
    "nutrition": {"calories": 380, "protein": 22, "carbs": 18, "fat": 24},
    "healthScore": 7,
    "ingredients": sec("Bisque",[
      ing("Lobster Tails","400","g","🦞"), ing("Butter","4","tbsp","🧈"),
      ing("Shallots","3","","🧅"), ing("Garlic","3","cloves","🧄"),
      ing("Tomato Paste","2","tbsp","🍅"), ing("Brandy","60","ml","🫙"),
      ing("White Wine","1/2","cup","🍷"), ing("Heavy Cream","300","ml","🥛"),
      ing("Chicken Broth","500","ml","🍲"), ing("Cayenne","1/4","tsp","🌶️"),
    ]),
    "steps": steps(
      "Cook lobster tails. Remove meat, reserve shells.",
      "Simmer shells in broth 20 minutes. Strain and reserve stock.",
      "Sauté shallots and garlic in butter. Add tomato paste.",
      "Flambé with brandy, then add white wine and lobster stock.",
      "Add cream and simmer until slightly thickened. Blend until smooth.",
      "Add lobster meat. Season with cayenne and serve garnished with cream.",
    ),
  },
  {
    "id": "tr_45", "title": "Bibimbap",
    "image": IMG("1553163147-622ab57be1c7"), "importCount": "4.1K",
    "sourcePlatform": "Instagram", "cuisine": "Korean", "category": "Dinner",
    "servings": 2, "prepTime": 30, "cookTime": 20,
    "tags": ["korean","rice bowl","bibimbap","vegetables","egg"],
    "nutrition": {"calories": 480, "protein": 22, "carbs": 62, "fat": 16},
    "healthScore": 9,
    "ingredients": sec("Rice & Base",[
      ing("Short Grain Rice","2","cups","🍚"), ing("Sesame Oil","2","tbsp","🫙"),
    ]) + sec("Toppings",[
      ing("Spinach","100","g","🌿"), ing("Carrots","2","","🥕"),
      ing("Zucchini","1","","🥒"), ing("Bean Sprouts","100","g","🌱"),
      ing("Ground Beef","200","g","🥩"), ing("Shiitake Mushrooms","6","","🍄"),
      ing("Eggs","2","","🥚"),
    ]) + sec("Sauce",[
      ing("Gochujang","3","tbsp","🌶️"), ing("Sesame Oil","1","tbsp","🫙"),
      ing("Sugar","1","tbsp","🍚"), ing("Garlic","2","cloves","🧄"),
    ]),
    "steps": steps(
      "Cook rice. Stir sesame oil into cooked rice.",
      "Season and sauté each vegetable separately.",
      "Cook seasoned beef until browned.",
      "Fry eggs sunny side up.",
      "Mix gochujang sauce ingredients.",
      "Assemble bowl with rice, vegetables arranged by color, beef, and egg. Top with sauce.",
    ),
  },
  {
    "id": "tr_46", "title": "Moussaka",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "2.4K",
    "sourcePlatform": "Pinterest", "cuisine": "Greek", "category": "Dinner",
    "servings": 6, "prepTime": 30, "cookTime": 60,
    "tags": ["greek","moussaka","lamb","eggplant","baked","comfort"],
    "nutrition": {"calories": 520, "protein": 28, "carbs": 32, "fat": 30},
    "healthScore": 7,
    "ingredients": sec("Meat Sauce",[
      ing("Ground Lamb","500","g","🥩"), ing("Onion","1","","🧅"),
      ing("Garlic","3","cloves","🧄"), ing("Canned Tomatoes","400","g","🍅"),
      ing("Cinnamon","1","tsp","🌿"), ing("Allspice","1/2","tsp","🌿"),
    ]) + sec("Layers",[
      ing("Eggplant","2","large","🍆"), ing("Potatoes","3","","🥔"),
    ]) + sec("Béchamel",[
      ing("Butter","60","g","🧈"), ing("Flour","60","g","🌾"),
      ing("Milk","600","ml","🥛"), ing("Parmesan","60","g","🧀"),
      ing("Eggs","2","","🥚"), ing("Nutmeg","1/4","tsp","🌿"),
    ]),
    "steps": steps(
      "Slice and salt eggplant. Let drain 30 minutes, then brush with oil and bake.",
      "Brown lamb with onion and garlic. Add tomatoes and spices. Simmer 20 min.",
      "Make béchamel: melt butter, add flour, then milk gradually. Finish with cheese and eggs.",
      "Layer: potatoes, meat sauce, eggplant, repeat, then pour béchamel on top.",
      "Bake at 180°C for 45 minutes until golden and bubbling.",
      "Rest 15 minutes before cutting. Serve with Greek salad.",
    ),
  },
  {
    "id": "tr_47", "title": "Tacos al Pastor",
    "image": IMG("1568901346375-23c9450c58cd"), "importCount": "5.8K",
    "sourcePlatform": "TikTok", "cuisine": "Mexican", "category": "Dinner",
    "servings": 4, "prepTime": 20, "cookTime": 25,
    "tags": ["tacos","al pastor","mexican","pork","pineapple"],
    "nutrition": {"calories": 390, "protein": 26, "carbs": 34, "fat": 16},
    "healthScore": 7,
    "ingredients": sec("Al Pastor",[
      ing("Pork Shoulder","700","g","🥩"), ing("Dried Guajillo Chilies","4","","🌶️"),
      ing("Dried Ancho Chili","2","","🌶️"), ing("Pineapple Juice","1/2","cup","🍍"),
      ing("Achiote Paste","2","tbsp","🟠"), ing("Garlic","4","cloves","🧄"),
      ing("Cumin","1","tsp","🌿"), ing("Oregano","1","tsp","🌿"),
    ]) + sec("Assembly",[
      ing("Corn Tortillas","12","","🫓"), ing("Pineapple","1/2","","🍍"),
      ing("White Onion","1/2","","🧅"), ing("Cilantro","1/2","cup","🌿"),
      ing("Salsa Roja","to serve","","🍅"),
    ]),
    "steps": steps(
      "Toast and rehydrate chilies. Blend with pineapple juice, achiote, and spices.",
      "Slice pork thin and marinate in chili paste overnight.",
      "Grill or cook pork on high heat until slightly charred.",
      "Warm tortillas. Top with pork, grilled pineapple, and onion.",
      "Add cilantro and serve with salsa.",
    ),
  },
  {
    "id": "tr_48", "title": "Chicken Shawarma Bowl",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "4.3K",
    "sourcePlatform": "Instagram", "cuisine": "Middle Eastern", "category": "Dinner",
    "servings": 3, "prepTime": 15, "cookTime": 20,
    "tags": ["shawarma","chicken","middle eastern","bowl","healthy"],
    "nutrition": {"calories": 480, "protein": 38, "carbs": 36, "fat": 20},
    "healthScore": 8,
    "ingredients": sec("Chicken",[
      ing("Chicken Thighs","600","g","🍗"), ing("Cumin","2","tsp","🌿"),
      ing("Turmeric","1","tsp","🟡"), ing("Paprika","2","tsp","🌶️"),
      ing("Cinnamon","1/2","tsp","🌿"), ing("Lemon Juice","2","tbsp","🍋"),
      ing("Olive Oil","3","tbsp","🫙"),
    ]) + sec("Bowl",[
      ing("Rice or Couscous","2","cups","🍚"), ing("Hummus","4","tbsp","🥣"),
      ing("Cucumber","1","","🥒"), ing("Cherry Tomatoes","1","cup","🍅"),
      ing("Red Onion","1/2","","🧅"), ing("Tahini Sauce","3","tbsp","🥄"),
      ing("Parsley","3","tbsp","🌿"),
    ]),
    "steps": steps(
      "Marinate chicken in all spices, lemon juice, and olive oil.",
      "Grill or pan-sear chicken 5-6 min per side until cooked.",
      "Rest and slice chicken.",
      "Build bowls: grain base, hummus, cucumber, and tomatoes.",
      "Add sliced chicken and drizzle with tahini.",
      "Garnish with parsley and red onion.",
    ),
  },
  {
    "id": "tr_49", "title": "Pho Bo (Vietnamese Beef Noodle Soup)",
    "image": IMG("1555939594-58d7cb561ad1"), "importCount": "3.7K",
    "sourcePlatform": "Instagram", "cuisine": "Vietnamese", "category": "Dinner",
    "servings": 4, "prepTime": 30, "cookTime": 180,
    "tags": ["pho","vietnamese","beef","soup","noodles","comfort"],
    "nutrition": {"calories": 420, "protein": 32, "carbs": 48, "fat": 12},
    "healthScore": 8,
    "ingredients": sec("Broth",[
      ing("Beef Bones","1","kg","🦴"), ing("Onion","2","","🧅"),
      ing("Ginger","1","piece","🫚"), ing("Cinnamon","2","sticks","🌿"),
      ing("Star Anise","4","","🌟"), ing("Cloves","4","","🌿"),
      ing("Fish Sauce","3","tbsp","🫙"), ing("Rock Sugar","1","tbsp","🍚"),
    ]) + sec("Bowl",[
      ing("Rice Noodles","300","g","🍜"), ing("Beef Sirloin (raw)","300","g","🥩"),
      ing("Bean Sprouts","1","cup","🌱"), ing("Thai Basil","1","cup","🌿"),
      ing("Lime","2","","🍋"), ing("Hoisin Sauce","to serve","","🫙"),
      ing("Sriracha","to serve","","🌶️"),
    ]),
    "steps": steps(
      "Char onion and ginger directly on flame or under broiler.",
      "Blanch bones, then simmer with charred aromatics and spices for 3 hours.",
      "Strain broth, season with fish sauce and rock sugar.",
      "Cook noodles per package. Divide into bowls.",
      "Add thin raw beef slices — the hot broth will cook them.",
      "Ladle hot broth over. Serve with bean sprouts, basil, and lime.",
    ),
  },
  {
    "id": "tr_50", "title": "Chicken Pot Pie",
    "image": IMG("1574071318508-1cdbab80d002"), "importCount": "3.0K",
    "sourcePlatform": "Pinterest", "cuisine": "American", "category": "Dinner",
    "servings": 6, "prepTime": 30, "cookTime": 45,
    "tags": ["pot pie","chicken","american","comfort","baked"],
    "nutrition": {"calories": 580, "protein": 28, "carbs": 42, "fat": 32},
    "healthScore": 6,
    "ingredients": sec("Filling",[
      ing("Chicken Breast","500","g","🍗"), ing("Butter","4","tbsp","🧈"),
      ing("Onion","1","","🧅"), ing("Carrots","2","","🥕"),
      ing("Celery","2","stalks","🌿"), ing("Peas","1","cup","🫛"),
      ing("Flour","1/3","cup","🌾"), ing("Chicken Broth","500","ml","🍲"),
      ing("Heavy Cream","200","ml","🥛"), ing("Thyme","1","tsp","🌿"),
    ]) + sec("Pastry",[
      ing("Store-Bought Pie Crust","2","sheets","🟡"), ing("Egg","1","","🥚"),
    ]),
    "steps": steps(
      "Cook and shred chicken. Sauté onion, carrots, and celery in butter.",
      "Stir in flour, then add broth and cream. Simmer until thick.",
      "Add chicken, peas, and thyme. Season well.",
      "Line pie dish with pastry. Add filling.",
      "Top with second pastry sheet. Crimp edges. Brush with egg wash.",
      "Bake at 200°C for 35-40 minutes until golden.",
    ),
  },
  # ---- SNACKS -------------------------------------------------------------
  {
    "id": "tr_51", "title": "Guacamole",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "3.4K",
    "sourcePlatform": "Instagram", "cuisine": "Mexican", "category": "Snacks",
    "servings": 4, "prepTime": 10, "cookTime": 0,
    "tags": ["guacamole","avocado","dip","vegan","snack","quick"],
    "nutrition": {"calories": 180, "protein": 2, "carbs": 12, "fat": 16},
    "healthScore": 9,
    "ingredients": sec("Guacamole",[
      ing("Ripe Avocados","3","","🥑"), ing("Lime Juice","2","tbsp","🍋"),
      ing("Red Onion","1/4","","🧅"), ing("Jalapeño","1","","🌶️"),
      ing("Cilantro","3","tbsp","🌿"), ing("Garlic","1","clove","🧄"),
      ing("Salt","to taste","","🧂"), ing("Cherry Tomatoes","6","","🍅"),
    ]),
    "steps": steps(
      "Mash avocados to your preferred texture.",
      "Finely dice onion, jalapeño, tomatoes, and cilantro.",
      "Mix everything together with lime juice.",
      "Season with salt and adjust lime to taste.",
      "Serve immediately with tortilla chips.",
    ),
  },
  {
    "id": "tr_52", "title": "Edamame with Sea Salt",
    "image": IMG("1512621776951-a57141f2eefd"), "importCount": "1.5K",
    "sourcePlatform": "Pinterest", "cuisine": "Japanese", "category": "Snacks",
    "servings": 2, "prepTime": 2, "cookTime": 5,
    "tags": ["edamame","japanese","snack","vegan","protein","healthy"],
    "nutrition": {"calories": 120, "protein": 11, "carbs": 9, "fat": 5},
    "healthScore": 10,
    "ingredients": sec("Edamame",[
      ing("Frozen Edamame (in pods)","250","g","🫘"),
      ing("Flaky Sea Salt","1","tsp","🧂"),
      ing("Sesame Oil","1","tsp","🫙"),
    ]),
    "steps": steps(
      "Boil salted water. Add edamame and cook 4-5 minutes.",
      "Drain well and transfer to a bowl.",
      "Toss with sesame oil and flaky sea salt.",
      "Serve warm and eat by squeezing pods into your mouth.",
    ),
  },
  {
    "id": "tr_53", "title": "Everything Bagel Hummus",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "2.1K",
    "sourcePlatform": "TikTok", "cuisine": "American", "category": "Snacks",
    "servings": 6, "prepTime": 10, "cookTime": 0,
    "tags": ["hummus","dip","everything bagel","chickpeas","snack"],
    "nutrition": {"calories": 160, "protein": 6, "carbs": 18, "fat": 7},
    "healthScore": 9,
    "ingredients": sec("Hummus",[
      ing("Canned Chickpeas","400","g","🫘"), ing("Tahini","3","tbsp","🥣"),
      ing("Lemon Juice","3","tbsp","🍋"), ing("Garlic","1","clove","🧄"),
      ing("Ice Water","3","tbsp","💧"), ing("Olive Oil","2","tbsp","🫙"),
    ]) + sec("Topping",[
      ing("Everything Bagel Seasoning","2","tbsp","🌿"),
      ing("Extra Olive Oil","1","tbsp","🫙"),
    ]),
    "steps": steps(
      "Drain and peel chickpeas for extra creamy texture.",
      "Blend chickpeas, tahini, lemon, garlic until smooth.",
      "Add ice water while blending to make it fluffy and light.",
      "Season with salt. Spread in a bowl, drizzle with oil.",
      "Top with everything bagel seasoning. Serve with pita or veggies.",
    ),
  },
  {
    "id": "tr_54", "title": "Korean Corn Dogs",
    "image": IMG("1563379926898-05f4575a45d8"), "importCount": "4.9K",
    "sourcePlatform": "TikTok", "cuisine": "Korean", "category": "Snacks",
    "servings": 4, "prepTime": 20, "cookTime": 10,
    "tags": ["korean","corn dog","fried","mozzarella","trending","snack"],
    "nutrition": {"calories": 380, "protein": 14, "carbs": 44, "fat": 18},
    "healthScore": 4,
    "ingredients": sec("Corn Dog",[
      ing("Mozzarella Sticks","4","","🧀"), ing("Hot Dogs","4","","🌭"),
      ing("All-Purpose Flour","1","cup","🌾"), ing("Sugar","2","tbsp","🍚"),
      ing("Baking Powder","1","tsp","🥄"), ing("Egg","1","","🥚"),
      ing("Milk","1/2","cup","🥛"), ing("Breadcrumbs","1","cup","🌾"),
      ing("Oil for frying","as needed","","🫙"),
    ]),
    "steps": steps(
      "Skewer mozzarella sticks and hot dogs together on a stick.",
      "Mix flour, sugar, baking powder, egg, and milk into a thick batter.",
      "Coat skewers in batter, then roll in breadcrumbs.",
      "Fry in 180°C oil, turning, until golden all over (~4 min).",
      "Drain and serve with ketchup and mustard. Optionally add sugar coating.",
    ),
  },
  {
    "id": "tr_55", "title": "Spinach Artichoke Dip",
    "image": IMG("1546069901-ba9599a7e63c"), "importCount": "2.8K",
    "sourcePlatform": "Pinterest", "cuisine": "American", "category": "Snacks",
    "servings": 8, "prepTime": 10, "cookTime": 25,
    "tags": ["dip","spinach","artichoke","cheese","party","baked"],
    "nutrition": {"calories": 220, "protein": 9, "carbs": 8, "fat": 18},
    "healthScore": 6,
    "ingredients": sec("Dip",[
      ing("Cream Cheese","250","g","🧀"), ing("Sour Cream","1/2","cup","🥄"),
      ing("Mayonnaise","1/4","cup","🥄"), ing("Frozen Spinach","250","g","🌿"),
      ing("Canned Artichoke Hearts","400","g","🌿"), ing("Garlic","3","cloves","🧄"),
      ing("Parmesan","60","g","🧀"), ing("Mozzarella","100","g","🧀"),
    ]),
    "steps": steps(
      "Thaw and squeeze all water from frozen spinach.",
      "Drain and chop artichoke hearts.",
      "Mix cream cheese, sour cream, mayo, and garlic until smooth.",
      "Fold in spinach, artichoke, and half the cheese.",
      "Transfer to a baking dish, top with remaining cheese.",
      "Bake at 190°C for 20-25 minutes until bubbly and golden.",
    ),
  },
  # ---- DESSERTS -----------------------------------------------------------
  {
    "id": "tr_56", "title": "Tiramisu",
    "image": IMG("1564355808539-22fda35bed7e"), "importCount": "4.2K",
    "sourcePlatform": "Pinterest", "cuisine": "Italian", "category": "Desserts",
    "servings": 8, "prepTime": 30, "cookTime": 0,
    "tags": ["tiramisu","italian","no-bake","coffee","classic","dessert"],
    "nutrition": {"calories": 380, "protein": 8, "carbs": 32, "fat": 24},
    "healthScore": 4,
    "ingredients": sec("Tiramisu",[
      ing("Egg Yolks","6","","🥚"), ing("Sugar","120","g","🍚"),
      ing("Mascarpone","500","g","🧀"), ing("Heavy Cream","300","ml","🥛"),
      ing("Ladyfinger Biscuits","300","g","🍪"), ing("Strong Espresso","300","ml","☕"),
      ing("Coffee Liqueur","3","tbsp","🫙"), ing("Cocoa Powder","3","tbsp","🟤"),
    ]),
    "steps": steps(
      "Whisk egg yolks and sugar until pale and thick.",
      "Fold in mascarpone until smooth.",
      "Whip cream to soft peaks and fold into mascarpone mixture.",
      "Dip ladyfingers briefly in espresso-liqueur mixture.",
      "Layer in a dish: soaked biscuits, cream mixture, repeat.",
      "Dust with cocoa. Refrigerate 4-6 hours or overnight.",
    ),
  },
  {
    "id": "tr_57", "title": "Mango Sticky Rice",
    "image": IMG("1490474418585-ba9bad8fd0ea"), "importCount": "3.6K",
    "sourcePlatform": "Instagram", "cuisine": "Thai", "category": "Desserts",
    "servings": 3, "prepTime": 10, "cookTime": 30,
    "tags": ["thai","mango","sticky rice","dessert","vegan","tropical"],
    "nutrition": {"calories": 380, "protein": 6, "carbs": 72, "fat": 10},
    "healthScore": 7,
    "ingredients": sec("Sticky Rice",[
      ing("Glutinous Rice","1.5","cups","🍚"), ing("Coconut Milk","400","ml","🥥"),
      ing("Sugar","4","tbsp","🍚"), ing("Salt","1/4","tsp","🧂"),
    ]) + sec("Serving",[
      ing("Ripe Mangoes","2","","🥭"), ing("Sesame Seeds","1","tbsp","🖤"),
      ing("Extra Coconut Milk","4","tbsp","🥥"),
    ]),
    "steps": steps(
      "Soak glutinous rice overnight. Steam for 25-30 minutes until tender.",
      "Heat coconut milk with sugar and salt until sugar dissolves.",
      "Mix warm rice with coconut milk mixture. Rest 20 minutes.",
      "Slice ripe mangoes.",
      "Serve sticky rice with mango slices, drizzled with extra coconut milk and sesame seeds.",
    ),
  },
  {
    "id": "tr_58", "title": "Crème Brûlée",
    "image": IMG("1564355808539-22fda35bed7e"), "importCount": "3.1K",
    "sourcePlatform": "Pinterest", "cuisine": "French", "category": "Desserts",
    "servings": 4, "prepTime": 15, "cookTime": 45,
    "tags": ["creme brulee","french","classic","vanilla","dessert"],
    "nutrition": {"calories": 420, "protein": 6, "carbs": 34, "fat": 28},
    "healthScore": 3,
    "ingredients": sec("Custard",[
      ing("Heavy Cream","500","ml","🥛"), ing("Egg Yolks","6","","🥚"),
      ing("Sugar","80","g","🍚"), ing("Vanilla Bean","1","","🌿"),
    ]) + sec("Topping",[
      ing("Caster Sugar","4","tbsp","🍚"),
    ]),
    "steps": steps(
      "Heat cream with vanilla bean until just simmering. Remove from heat.",
      "Whisk yolks and sugar until pale. Gradually add warm cream.",
      "Strain custard into ramekins.",
      "Bake in a water bath at 160°C for 35-40 minutes until just set.",
      "Chill 4 hours or overnight.",
      "Sprinkle sugar on top and torch until caramelized. Serve immediately.",
    ),
  },
  {
    "id": "tr_59", "title": "Churros with Chocolate Sauce",
    "image": IMG("1564355808539-22fda35bed7e"), "importCount": "4.8K",
    "sourcePlatform": "TikTok", "cuisine": "Spanish", "category": "Desserts",
    "servings": 4, "prepTime": 15, "cookTime": 15,
    "tags": ["churros","spanish","fried","chocolate","dessert","sweet"],
    "nutrition": {"calories": 440, "protein": 8, "carbs": 58, "fat": 20},
    "healthScore": 3,
    "ingredients": sec("Churros",[
      ing("Water","250","ml","💧"), ing("Butter","50","g","🧈"),
      ing("Flour","150","g","🌾"), ing("Eggs","2","","🥚"),
      ing("Cinnamon Sugar","4","tbsp","🌿"), ing("Oil for frying","as needed","","🫙"),
    ]) + sec("Chocolate Sauce",[
      ing("Dark Chocolate","150","g","🍫"), ing("Heavy Cream","100","ml","🥛"),
      ing("Butter","20","g","🧈"), ing("Sugar","2","tbsp","🍚"),
    ]),
    "steps": steps(
      "Bring water and butter to a boil. Add flour all at once and stir vigorously.",
      "Off heat, beat in eggs one at a time until smooth and glossy.",
      "Pipe into hot oil (180°C) and fry until golden, about 3-4 min.",
      "Drain and roll immediately in cinnamon sugar.",
      "Melt chocolate with cream and butter for the dipping sauce.",
      "Serve churros hot with chocolate sauce.",
    ),
  },
  {
    "id": "tr_60", "title": "Matcha Ice Cream",
    "image": IMG("1490474418585-ba9bad8fd0ea"), "importCount": "2.7K",
    "sourcePlatform": "Instagram", "cuisine": "Japanese", "category": "Desserts",
    "servings": 6, "prepTime": 20, "cookTime": 0,
    "tags": ["matcha","ice cream","japanese","green tea","no-churn"],
    "nutrition": {"calories": 320, "protein": 5, "carbs": 28, "fat": 22},
    "healthScore": 5,
    "ingredients": sec("Ice Cream",[
      ing("Heavy Cream","400","ml","🥛"), ing("Sweetened Condensed Milk","200","ml","🥛"),
      ing("Matcha Powder","3","tbsp","🍵"), ing("Vanilla Extract","1","tsp","🍶"),
      ing("Hot Water","2","tbsp","💧"),
    ]),
    "steps": steps(
      "Dissolve matcha in hot water to make a paste.",
      "Whip heavy cream to stiff peaks.",
      "Fold condensed milk, matcha paste, and vanilla into whipped cream.",
      "Pour into a freezer-safe container. Smooth the top.",
      "Freeze at least 6 hours or overnight. Scoop and serve.",
    ),
  },
  {
    "id": "tr_61", "title": "Banana Bread",
    "image": IMG("1574071318508-1cdbab80d002"), "importCount": "3.9K",
    "sourcePlatform": "Pinterest", "cuisine": "American", "category": "Desserts",
    "servings": 8, "prepTime": 15, "cookTime": 60,
    "tags": ["banana bread","baking","comfort","sweet","snack"],
    "nutrition": {"calories": 280, "protein": 5, "carbs": 42, "fat": 10},
    "healthScore": 6,
    "ingredients": sec("Batter",[
      ing("Ripe Bananas","3","","🍌"), ing("All-Purpose Flour","200","g","🌾"),
      ing("Sugar","150","g","🍚"), ing("Butter","80","g","🧈"),
      ing("Eggs","2","","🥚"), ing("Vanilla","1","tsp","🍶"),
      ing("Baking Soda","1","tsp","🥄"), ing("Salt","1/2","tsp","🧂"),
      ing("Walnuts","60","g","🌰"),
    ]),
    "steps": steps(
      "Preheat oven to 175°C. Mash bananas thoroughly.",
      "Cream butter and sugar until light. Beat in eggs and vanilla.",
      "Mix in mashed bananas.",
      "Fold in flour, baking soda, and salt until just combined.",
      "Fold in walnuts. Pour into greased loaf pan.",
      "Bake 55-65 minutes until a toothpick comes out clean.",
    ),
  },
  {
    "id": "tr_62", "title": "Mochi Ice Cream",
    "image": IMG("1490474418585-ba9bad8fd0ea"), "importCount": "3.2K",
    "sourcePlatform": "TikTok", "cuisine": "Japanese", "category": "Desserts",
    "servings": 6, "prepTime": 30, "cookTime": 5,
    "tags": ["mochi","japanese","ice cream","dessert","rice cake"],
    "nutrition": {"calories": 180, "protein": 3, "carbs": 32, "fat": 5},
    "healthScore": 6,
    "ingredients": sec("Mochi Dough",[
      ing("Glutinous Rice Flour","200","g","🌾"), ing("Sugar","4","tbsp","🍚"),
      ing("Water","200","ml","💧"), ing("Cornstarch (for dusting)","as needed","","🌾"),
    ]) + sec("Filling",[
      ing("Ice Cream (any flavor)","1","pint","🍨"),
    ]),
    "steps": steps(
      "Scoop ice cream into balls, freeze solid on parchment (at least 1 hour).",
      "Mix rice flour, sugar, and water. Microwave 2 min, stir, microwave 1 more min.",
      "Turn out onto cornstarch-dusted surface. Let cool slightly.",
      "Divide dough into circles. Stretch and wrap around ice cream ball.",
      "Pinch to seal and freeze until firm.",
    ),
  },
  {
    "id": "tr_63", "title": "Tres Leches Cake",
    "image": IMG("1564355808539-22fda35bed7e"), "importCount": "2.9K",
    "sourcePlatform": "Pinterest", "cuisine": "Mexican", "category": "Desserts",
    "servings": 10, "prepTime": 25, "cookTime": 30,
    "tags": ["tres leches","mexican","cake","moist","dessert","party"],
    "nutrition": {"calories": 420, "protein": 9, "carbs": 52, "fat": 20},
    "healthScore": 4,
    "ingredients": sec("Cake",[
      ing("All-Purpose Flour","200","g","🌾"), ing("Eggs","5","","🥚"),
      ing("Sugar","200","g","🍚"), ing("Milk","120","ml","🥛"),
      ing("Baking Powder","2","tsp","🥄"), ing("Vanilla","1","tsp","🍶"),
    ]) + sec("Three Milks",[
      ing("Sweetened Condensed Milk","400","ml","🥛"),
      ing("Evaporated Milk","300","ml","🥛"),
      ing("Heavy Cream","200","ml","🥛"),
    ]) + sec("Topping",[
      ing("Heavy Cream (whipped)","300","ml","🥛"),
      ing("Ground Cinnamon","to dust","","🌿"),
    ]),
    "steps": steps(
      "Beat eggs and sugar until doubled in volume. Fold in flour.",
      "Bake sponge at 175°C for 25-30 minutes.",
      "Mix three milks. Poke holes all over warm cake.",
      "Pour milk mixture slowly over cake. Refrigerate 4 hours.",
      "Top with whipped cream and dust with cinnamon.",
    ),
  },
  {
    "id": "tr_64", "title": "Gulab Jamun",
    "image": IMG("1564355808539-22fda35bed7e"), "importCount": "2.4K",
    "sourcePlatform": "Instagram", "cuisine": "Indian", "category": "Desserts",
    "servings": 20, "prepTime": 20, "cookTime": 20,
    "tags": ["gulab jamun","indian","dessert","fried","sweet","diwali"],
    "nutrition": {"calories": 180, "protein": 4, "carbs": 28, "fat": 6},
    "healthScore": 3,
    "ingredients": sec("Dough",[
      ing("Milk Powder","200","g","🥛"), ing("All-Purpose Flour","3","tbsp","🌾"),
      ing("Baking Powder","1/4","tsp","🥄"), ing("Butter","2","tbsp","🧈"),
      ing("Milk","6","tbsp","🥛"),
    ]) + sec("Sugar Syrup",[
      ing("Sugar","400","g","🍚"), ing("Water","400","ml","💧"),
      ing("Cardamom Pods","4","","🌿"), ing("Rose Water","1","tsp","🌸"),
    ]),
    "steps": steps(
      "Mix milk powder, flour, baking powder, and butter. Add milk to form soft dough.",
      "Roll into smooth balls — no cracks.",
      "Make sugar syrup by boiling sugar, water, and cardamom. Add rose water.",
      "Fry balls in medium-low oil until deep golden brown.",
      "Immediately drop into warm syrup. Soak at least 2 hours.",
    ),
  },
  {
    "id": "tr_65", "title": "Churro Cheesecake Bars",
    "image": IMG("1564355808539-22fda35bed7e"), "importCount": "5.3K",
    "sourcePlatform": "TikTok", "cuisine": "American", "category": "Desserts",
    "servings": 12, "prepTime": 20, "cookTime": 30,
    "tags": ["cheesecake","churro","bars","trending","easy","dessert"],
    "nutrition": {"calories": 340, "protein": 5, "carbs": 38, "fat": 18},
    "healthScore": 3,
    "ingredients": sec("Bars",[
      ing("Crescent Roll Dough","2","cans","🌾"), ing("Cream Cheese","500","g","🧀"),
      ing("Sugar","120","g","🍚"), ing("Vanilla Extract","1","tsp","🍶"),
      ing("Egg","1","","🥚"),
    ]) + sec("Cinnamon Sugar",[
      ing("Butter","60","g","🧈"), ing("Sugar","4","tbsp","🍚"),
      ing("Cinnamon","2","tsp","🌿"),
    ]),
    "steps": steps(
      "Press one can of crescent dough into a greased 9x13 pan.",
      "Beat cream cheese, sugar, vanilla, and egg until smooth.",
      "Spread cream cheese filling over dough.",
      "Layer second can of crescent dough on top.",
      "Brush with melted butter and sprinkle cinnamon sugar generously.",
      "Bake at 180°C for 25-30 minutes until golden. Cool before cutting.",
    ),
  },
]

# ---------------------------------------------------------------------------
# Write recipe files
# ---------------------------------------------------------------------------
def write_recipe(recipe: dict):
    rid = recipe["id"]
    folder = RECIPES_DIR / rid
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "recipe.json").write_text(json.dumps(recipe, ensure_ascii=False, indent=2))

def build_index(recipes: list) -> dict:
    entries = []
    for r in recipes:
        entries.append({
            "id": r["id"],
            "title": r["title"],
            "image": r["image"],
            "sourcePlatform": r["sourcePlatform"],
            "importCount": r["importCount"],
            "healthScore": r["healthScore"],
            "cuisine": r.get("cuisine", ""),
            "category": r.get("category", ""),
            "nutrition": r["nutrition"],
            "tags": r["tags"],
        })
    return {
        "version": 2,
        "updatedAt": "2026-04-24T00:00:00.000Z",
        "recipeCount": len(entries),
        "recipes": entries,
        "recipeBaseUrl": "https://huangrui199126.github.io/receipe-me/data/recipes",
    }

if __name__ == "__main__":
    # Load existing 10 recipes
    existing = []
    for i in range(1, 11):
        p = RECIPES_DIR / f"tr_{i}" / "recipe.json"
        if p.exists():
            existing.append(json.loads(p.read_text()))

    all_recipes = existing + RECIPES

    print(f"Writing {len(RECIPES)} new recipes...")
    for r in RECIPES:
        write_recipe(r)
        print(f"  ✓ {r['id']}: {r['title']}")

    # Rebuild index with all recipes
    index = build_index(all_recipes)
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))
    print(f"\n✅ index.json updated — {index['recipeCount']} total recipes")
