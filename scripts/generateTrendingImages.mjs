/**
 * Pre-generate step images for all trending recipes using fal.ai FLUX IP-Adapter.
 * Run once: node scripts/generateTrendingImages.mjs
 * Outputs a JSON file with { recipeId: { stepOrder: imageUrl } }
 */

const FAL_API_KEY = '2fb3db94-36f1-4167-a99a-a48047a348a2:abe30fec4ae5b981ce44e77bc084de5d';

const TRENDING_RECIPES = [
  {
    id: 'tr_1', title: 'Crispy Garlic Parmesan Chicken Wraps',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Slice chicken breast and thighs into cubes. Add seasonings with grated parmesan cheese and a drizzle of olive oil. Mix until well coated.' },
      { order: 2, instruction: 'In a pan on low heat, add light butter with seasonings. Toast for a minute before adding evaporated milk, extra Parmesan and cream cheese. Stir till smooth and creamy.' },
      { order: 3, instruction: 'Line a sheet pan with parchment paper, spread marinated chicken evenly. Bake in a preheated oven at 200°C for 20-22 minutes until crispy.' },
      { order: 4, instruction: 'While chicken is still hot, add extra parmesan and parsley. Mix well until coated and extra cheesy.' },
      { order: 5, instruction: 'Assemble the wraps with shredded lettuce, onion, tomato, crispy chicken and sauce. Enjoy!' },
    ],
  },
  {
    id: 'tr_2', title: 'One-Tray Caramelized Onion & Garlic Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Slice onions into thin rings. Separate garlic cloves but leave whole.' },
      { order: 2, instruction: 'Add oil and butter to a large oven-safe pan over medium heat. Add onions, thyme, salt and pepper. Cook stirring occasionally for 10 minutes.' },
      { order: 3, instruction: 'Transfer to oven at 180°C. Roast for 30 minutes, stirring halfway, until deep golden and caramelized.' },
      { order: 4, instruction: 'Meanwhile, cook spaghetti in salted water until al dente. Reserve 1 cup pasta water before draining.' },
      { order: 5, instruction: 'Return pan to stove. Add balsamic vinegar and stir. Add cooked pasta and splash of pasta water. Toss well.' },
      { order: 6, instruction: 'Finish with grated parmesan, extra olive oil and black pepper. Serve immediately.' },
    ],
  },
  {
    id: 'tr_3', title: 'Beijing Beef',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Mix sliced beef with cornstarch and egg until well coated. Set aside for 15 minutes.' },
      { order: 2, instruction: 'Whisk together all sauce ingredients in a bowl. Set aside.' },
      { order: 3, instruction: 'Heat oil in a wok or large pan over high heat. Fry beef in batches until crispy, about 2-3 minutes per batch. Drain on paper towels.' },
      { order: 4, instruction: 'Remove most of the oil. Stir-fry onion and bell pepper for 2 minutes. Add garlic and cook 30 seconds.' },
      { order: 5, instruction: 'Pour sauce into the pan and bring to a boil. Add crispy beef and toss to coat evenly.' },
      { order: 6, instruction: 'Serve over steamed rice, garnished with green onions.' },
    ],
  },
  {
    id: 'tr_4', title: 'Honey Garlic Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Pat salmon dry and season with salt and pepper on both sides.' },
      { order: 2, instruction: 'Mix honey, soy sauce, garlic and lemon juice in a small bowl.' },
      { order: 3, instruction: 'Heat olive oil in a non-stick pan over medium-high heat. Cook salmon skin-side up for 4 minutes, then flip.' },
      { order: 4, instruction: 'Pour honey garlic sauce over salmon. Cook for another 3-4 minutes, basting frequently, until caramelized.' },
      { order: 5, instruction: 'Garnish with fresh parsley and serve with steamed vegetables or rice.' },
    ],
  },
  {
    id: 'tr_5', title: 'Creamy Tuscan Chicken',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Season chicken breasts with Italian seasoning, salt and pepper on both sides.' },
      { order: 2, instruction: 'Heat olive oil and butter in a large pan. Sear chicken 6-7 minutes per side until golden. Set aside.' },
      { order: 3, instruction: 'In the same pan, sauté garlic for 1 minute. Add sun-dried tomatoes and cook 2 minutes.' },
      { order: 4, instruction: 'Pour in heavy cream and bring to a simmer. Stir in parmesan until melted and sauce thickens.' },
      { order: 5, instruction: 'Add spinach and stir until wilted. Return chicken to pan and coat with sauce. Serve.' },
    ],
  },
  {
    id: 'tr_6', title: 'Avocado Toast with Poached Egg',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Toast sourdough slices until golden and crispy.' },
      { order: 2, instruction: 'Mash avocado with lemon juice, salt and pepper. Spread generously on toast.' },
      { order: 3, instruction: 'Bring water with vinegar to a gentle simmer. Create a whirlpool and crack each egg in. Poach 3-4 minutes for a runny yolk.' },
      { order: 4, instruction: 'Place poached egg on avocado toast. Season with red pepper flakes and everything bagel seasoning. Serve immediately.' },
    ],
  },
  {
    id: 'tr_7', title: 'Chocolate Lava Cake',
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Preheat oven to 220°C. Butter four ramekins and dust with cocoa powder.' },
      { order: 2, instruction: 'Melt chocolate and butter together in a double boiler, stirring until smooth. Cool slightly.' },
      { order: 3, instruction: 'Whisk eggs, egg yolks and sugar together until thick and pale, about 3 minutes.' },
      { order: 4, instruction: 'Fold chocolate mixture into egg mixture. Sift in flour and salt, fold until just combined.' },
      { order: 5, instruction: 'Divide batter evenly among ramekins. Bake 10-12 minutes until edges are set but centre jiggles.' },
      { order: 6, instruction: 'Let sit 1 minute, then invert onto plates. Serve immediately with vanilla ice cream.' },
    ],
  },
  {
    id: 'tr_8', title: 'Greek Chicken Bowl',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Mix olive oil, lemon juice, garlic and oregano. Marinate chicken for at least 15 minutes.' },
      { order: 2, instruction: 'Mix yogurt, grated cucumber, garlic and dill to make tzatziki. Season and refrigerate.' },
      { order: 3, instruction: 'Cook marinated chicken in a hot grill pan 6-7 minutes per side. Rest 5 minutes, then slice.' },
      { order: 4, instruction: 'Assemble bowls with rice, sliced chicken, tomatoes, cucumber and olives.' },
      { order: 5, instruction: 'Top with tzatziki, crumbled feta and a drizzle of olive oil.' },
    ],
  },
  {
    id: 'tr_9', title: 'Crispy Quinoa Asparagus Salad',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Cook quinoa. Spread on a baking sheet and bake at 200°C for 15-20 minutes until crispy.' },
      { order: 2, instruction: 'Toss asparagus and chickpeas with olive oil, salt and pepper. Roast at 200°C for 20 minutes.' },
      { order: 3, instruction: 'Whisk together lemon juice, mustard, honey and olive oil for the dressing.' },
      { order: 4, instruction: 'Combine spinach, cherry tomatoes, roasted asparagus and chickpeas in a large bowl.' },
      { order: 5, instruction: 'Add crispy quinoa, drizzle with dressing and toss gently. Top with crumbled feta.' },
    ],
  },
  {
    id: 'tr_10', title: 'Korean Beef Bibimbap',
    image: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&q=80',
    steps: [
      { order: 1, instruction: 'Mix soy sauce, sesame oil, brown sugar, garlic and ginger. Brown ground beef, add sauce and cook until glazed.' },
      { order: 2, instruction: 'Quickly sauté carrots and spinach separately with a little sesame oil and salt.' },
      { order: 3, instruction: 'Whisk gochujang sauce ingredients together.' },
      { order: 4, instruction: 'Fry eggs sunny-side up.' },
      { order: 5, instruction: 'Divide rice into bowls. Arrange beef, carrots, spinach and cucumber over rice. Top with a fried egg and gochujang sauce.' },
    ],
  },
];

async function generateStepImage(recipeTitle, stepInstruction, recipeImageUrl, stepNum, totalSteps) {
  const action = stepInstruction.split(/[.!]/)[0].trim().slice(0, 80);
  const prompt = `Professional food photography, cooking step ${stepNum} of ${totalSteps} for ${recipeTitle}: ${action}. Close-up, warm kitchen lighting, shallow depth of field, appetizing, high resolution. No text, no watermarks.`;

  // Use image-to-image with the final dish photo as reference (strength=0.75 = mostly prompt-driven,
  // but inherits colors/style from the reference for visual consistency across steps)
  const response = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_url: recipeImageUrl,
      strength: 0.85,
      num_inference_steps: 20,
      num_images: 1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`fal.ai error: ${err}`);
  }

  const data = await response.json();
  return data?.images?.[0]?.url ?? null;
}

async function main() {
  const results = {};
  let totalSteps = 0;
  let generated = 0;

  for (const recipe of TRENDING_RECIPES) {
    totalSteps += recipe.steps.length;
  }

  console.log(`Generating ${totalSteps} step images across ${TRENDING_RECIPES.length} recipes...\n`);

  for (const recipe of TRENDING_RECIPES) {
    console.log(`\n📖 ${recipe.title}`);
    results[recipe.id] = {};

    for (const step of recipe.steps) {
      process.stdout.write(`  Step ${step.order}/${recipe.steps.length}... `);
      try {
        const url = await generateStepImage(
          recipe.title,
          step.instruction,
          recipe.image,
          step.order,
          recipe.steps.length
        );
        results[recipe.id][step.order] = url;
        generated++;
        console.log(`✓ (${generated}/${totalSteps})`);
      } catch (e) {
        console.log(`✗ ${e.message}`);
        results[recipe.id][step.order] = null;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Write results
  import('fs').then(fs => {
    fs.writeFileSync('./scripts/generatedStepImages.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Done! Results saved to scripts/generatedStepImages.json');
    console.log(`Generated ${generated}/${totalSteps} images`);
  });
}

main().catch(console.error);
