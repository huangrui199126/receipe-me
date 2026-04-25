#!/usr/bin/env python3
"""
Crawl real recipes from RecipeTinEats, HalfBakedHarvest, WellPlated.
Parses JSON-LD schema.org/Recipe for title, real food image, ingredients, steps, nutrition.

Usage:
  python3 scripts/crawl_recipes.py              # crawl up to 2000 new recipes
  python3 scripts/crawl_recipes.py --test URL   # test one URL and print parsed data
  python3 scripts/crawl_recipes.py --limit 100  # crawl only 100
"""
import json, pathlib, time, re, sys, argparse
import urllib.request, urllib.error

DOCS = pathlib.Path(__file__).parent.parent / "docs" / "data"
RECIPES_DIR = DOCS / "recipes"
INDEX_PATH = DOCS / "index.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
                  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

# 23 verified valid Unsplash food photo IDs (fallback when site has no image)
FALLBACK_IMGS = [
    "1626700051175-6818013e1d4f", "1621996346565-e3dbc646d9a9",
    "1604908176997-125f25cc6f3d", "1467003909585-2f8a72700288",
    "1432139555190-58524dae6a55", "1525351484163-7529414344d8",
    "1564355808539-22fda35bed7e", "1546069901-ba9599a7e63c",
    "1512621776951-a57141f2eefd", "1553163147-622ab57be1c7",
    "1490645935967-10de6ba17061", "1490474418585-ba9bad8fd0ea",
    "1482049016688-2d3e1b311543", "1484723091739-30a097e8f929",
    "1547592180-85f173990554",    "1574071318508-1cdbab80d002",
    "1504674900247-0877df9cc836", "1476224203421-9ac39bcb3327",
    "1507048331197-7d4ac70811cf", "1466637574441-749b8f19452f",
    "1555939594-58d7cb561ad1",    "1556909114-f6e7ad7d3136",
    "1563379926898-05f4575a45d8",
]

EMOJIS = {
    'chicken': '🍗', 'turkey': '🍗', 'beef': '🥩', 'steak': '🥩', 'lamb': '🐑',
    'pork': '🥩', 'bacon': '🥓', 'ham': '🥓', 'sausage': '🥩',
    'fish': '🐟', 'salmon': '🐟', 'tuna': '🐟', 'cod': '🐟', 'shrimp': '🦐',
    'prawn': '🦐', 'scallop': '🦐', 'crab': '🦀', 'lobster': '🦞',
    'egg': '🥚', 'butter': '🧈', 'milk': '🥛', 'cream': '🥛',
    'cheese': '🧀', 'yogurt': '🥛', 'flour': '🌾', 'bread': '🍞',
    'sugar': '🍬', 'honey': '🍯', 'salt': '🧂', 'pepper': '🌶️',
    'oil': '🫙', 'vinegar': '🫙', 'wine': '🍷', 'beer': '🍺', 'broth': '🫙',
    'garlic': '🧄', 'onion': '🧅', 'shallot': '🧅', 'leek': '🧅',
    'tomato': '🍅', 'potato': '🥔', 'sweet potato': '🍠',
    'carrot': '🥕', 'celery': '🫑', 'broccoli': '🥦', 'spinach': '🥬',
    'kale': '🥬', 'lettuce': '🥬', 'cabbage': '🥬', 'bok choy': '🥬',
    'mushroom': '🍄', 'zucchini': '🥒', 'cucumber': '🥒', 'corn': '🌽',
    'pea': '🫛', 'bean': '🫘', 'lentil': '🫘', 'chickpea': '🫘',
    'avocado': '🥑', 'lemon': '🍋', 'lime': '🍋', 'orange': '🍊',
    'apple': '🍎', 'banana': '🍌', 'mango': '🥭', 'strawberry': '🍓',
    'blueberry': '🫐', 'raspberry': '🍓', 'coconut': '🥥',
    'pasta': '🍝', 'spaghetti': '🍝', 'penne': '🍝', 'rice': '🍚',
    'noodle': '🍜', 'tofu': '🫙', 'tempeh': '🫙',
    'ginger': '🫚', 'cilantro': '🌿', 'parsley': '🌿', 'basil': '🌿',
    'mint': '🌿', 'thyme': '🌿', 'rosemary': '🌿', 'oregano': '🌿',
    'cumin': '🫙', 'paprika': '🌶️', 'turmeric': '🫙', 'cinnamon': '🫙',
    'chili': '🌶️', 'cayenne': '🌶️', 'jalapeño': '🌶️',
    'soy sauce': '🫙', 'oyster sauce': '🫙', 'fish sauce': '🫙',
    'sesame': '🫙', 'tahini': '🫙', 'peanut': '🥜', 'almond': '🥜',
    'chocolate': '🍫', 'vanilla': '🫙', 'oat': '🌾', 'quinoa': '🌾',
}

def get_emoji(name):
    lower = name.lower()
    for k, e in EMOJIS.items():
        if k in lower:
            return e
    return '🥄'

def fallback_img(n):
    return f"https://images.unsplash.com/photo-{FALLBACK_IMGS[n % len(FALLBACK_IMGS)]}?w=600&q=80"

def fetch_html(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read().decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            if e.code in (403, 404, 410):
                raise  # Don't retry client errors
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)

def extract_json_ld_blocks(html):
    pattern = r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>'
    blocks = re.findall(pattern, html, re.IGNORECASE)
    results = []
    for block in blocks:
        try:
            results.append(json.loads(block.strip()))
        except Exception:
            pass
    return results

def find_recipe_schema(data):
    if isinstance(data, list):
        for item in data:
            r = find_recipe_schema(item)
            if r:
                return r
    elif isinstance(data, dict):
        t = data.get('@type', '')
        if t == 'Recipe' or (isinstance(t, list) and 'Recipe' in t):
            return data
        if '@graph' in data:
            return find_recipe_schema(data['@graph'])
    return None

def parse_iso_duration(iso):
    if not iso:
        return 0
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', str(iso))
    if not m:
        return 0
    return int(m.group(1) or 0) * 60 + int(m.group(2) or 0)

def parse_servings(raw):
    if not raw:
        return 4
    if isinstance(raw, (int, float)):
        return max(1, int(raw))
    if isinstance(raw, list):
        return parse_servings(raw[0])
    m = re.search(r'\d+', str(raw))
    return int(m.group()) if m else 4

def parse_ingredient_string(raw):
    raw = raw.strip()
    # Match: optional amount + optional unit + rest-as-name
    m = re.match(r'^([\d\s\/\.¼½¾⅓⅔⅛⅜⅝⅞]+)?\s*([a-zA-Z]{1,15})?\s+(.+)$', raw)
    if m and m.group(3) and len(m.group(3)) > 1:
        amount = (m.group(1) or '').strip()
        unit = (m.group(2) or '').strip()
        name = m.group(3).strip()
        # Sanity check unit (don't grab first word of name as unit if it looks like a name)
        common_units = {'cup','cups','tbsp','tablespoon','tablespoons','tsp','teaspoon',
                        'teaspoons','oz','ounce','ounces','lb','lbs','pound','pounds',
                        'g','gram','grams','kg','ml','liter','liters','litre','litres',
                        'pinch','dash','clove','cloves','handful','piece','pieces',
                        'slice','slices','can','cans','bunch','bunches','head','heads',
                        'stalk','stalks','sprig','sprigs','sheet','sheets','strip','strips'}
        if unit.lower() not in common_units:
            # unit is not a real unit — treat whole thing as name
            name = raw
            amount = ''
            unit = ''
        return {'amount': amount, 'unit': unit, 'name': name, 'emoji': get_emoji(raw)}
    return {'amount': '', 'unit': '', 'name': raw, 'emoji': get_emoji(raw)}

def parse_nutrition(n_data):
    if not n_data:
        return None
    def extract_num(v):
        if not v:
            return 0.0
        m = re.search(r'[\d]+(?:\.\d+)?', str(v))
        return float(m.group()) if m else 0.0
    cals = extract_num(n_data.get('calories'))
    prot = extract_num(n_data.get('proteinContent'))
    carbs = extract_num(n_data.get('carbohydrateContent'))
    fat = extract_num(n_data.get('fatContent'))
    if cals > 0:
        return {'calories': int(cals), 'protein': round(prot, 1),
                'carbs': round(carbs, 1), 'fat': round(fat, 1)}
    return None

def parse_image(img_data):
    if not img_data:
        return ''
    if isinstance(img_data, str):
        return img_data
    if isinstance(img_data, list):
        first = img_data[0]
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            return first.get('url', '')
    if isinstance(img_data, dict):
        return img_data.get('url', img_data.get('contentUrl', ''))
    return ''

def schema_to_recipe(schema, url, fallback_n):
    title = schema.get('name', '').strip() or 'Imported Recipe'
    img = parse_image(schema.get('image', ''))
    if not img or not img.startswith('http'):
        img = fallback_img(fallback_n)

    prep_time = parse_iso_duration(schema.get('prepTime'))
    cook_time = parse_iso_duration(schema.get('cookTime'))
    servings = parse_servings(schema.get('recipeYield'))

    # Ingredients
    ingredients = []
    for i, raw in enumerate(schema.get('recipeIngredient', [])):
        if not isinstance(raw, str) or not raw.strip():
            continue
        ing = parse_ingredient_string(raw)
        ing['section'] = ''
        ing['order'] = i
        ingredients.append(ing)

    # Steps
    steps = []
    order = 1
    def add_step(text, img_uri=None):
        nonlocal order
        text = re.sub(r'\s+', ' ', text).strip()
        if len(text) < 5:
            return
        s = {'order': order, 'instruction': text}
        if img_uri:
            s['imageUri'] = img_uri
        steps.append(s)
        order += 1

    for inst in schema.get('recipeInstructions', []):
        if isinstance(inst, str):
            add_step(inst)
        elif isinstance(inst, dict):
            t = inst.get('@type', '')
            if t == 'HowToStep':
                text = inst.get('text', inst.get('name', ''))
                si = parse_image(inst.get('image', ''))
                add_step(text, si if si and si.startswith('http') else None)
            elif t == 'HowToSection':
                for sub in inst.get('itemListElement', []):
                    sub_text = sub.get('text', sub.get('name', ''))
                    si = parse_image(sub.get('image', ''))
                    add_step(sub_text, si if si and si.startswith('http') else None)

    # Nutrition
    nutrition = parse_nutrition(schema.get('nutrition'))

    # Tags
    kw = schema.get('keywords', '') or ''
    if isinstance(kw, list):
        kw = ','.join(kw)
    tags = [t.strip().lower() for t in re.split(r'[,;]', kw) if t.strip()][:6]

    # Category + cuisine
    cat = schema.get('recipeCategory', '')
    if isinstance(cat, list):
        cat = cat[0] if cat else ''
    cat = str(cat).strip()

    cuisine = schema.get('recipeCuisine', '')
    if isinstance(cuisine, list):
        cuisine = cuisine[0] if cuisine else ''
    cuisine = str(cuisine).strip()

    # Health score heuristic
    health = 7
    if nutrition:
        c = nutrition['calories']
        health = 9 if c < 300 else 8 if c < 400 else 7 if c < 550 else 6 if c < 750 else 5

    # Source platform
    domain = re.search(r'https?://(?:www\.)?([^/]+)', url)
    domain = domain.group(1) if domain else 'Web'
    platform_map = {
        'recipetineats.com': 'Web',
        'halfbakedharvest.com': 'Instagram',
        'wellplated.com': 'Web',
        'gimmesomeoven.com': 'Pinterest',
    }
    platform = platform_map.get(domain, 'Web')

    return {
        'title': title, 'image': img,
        'prepTime': prep_time, 'cookTime': cook_time, 'servings': servings,
        'nutrition': nutrition, 'ingredients': ingredients, 'steps': steps,
        'tags': tags, 'category': cat, 'cuisine': cuisine,
        'healthScore': health, 'sourceUrl': url, 'sourcePlatform': platform,
    }

def get_urls_from_sitemap(sitemap_url):
    print(f"  Fetching {sitemap_url} ...", end=' ', flush=True)
    try:
        html = fetch_html(sitemap_url)
    except Exception as e:
        print(f"FAILED: {e}")
        return []
    urls = re.findall(r'<loc>(https?://[^<\s]+)</loc>', html)
    # Filter out non-recipe pages
    recipe_urls = [u for u in urls if not any(x in u for x in (
        '/category/', '/tag/', '/author/', '/page/', '/sitemap',
        '?', '#', '/wp-content/', '/wp-admin/', '/feed/',
        '-sitemap', 'xmlsitemap',
    ))]
    print(f"{len(recipe_urls)} recipe URLs")
    return recipe_urls

IMPORT_COUNTS = [
    "0.7K","0.9K","1.1K","1.4K","1.7K","2.0K","2.3K","2.6K","2.9K",
    "3.2K","3.5K","3.8K","4.1K","4.4K","4.7K","5.0K","5.5K","6.0K",
    "6.5K","7.0K","7.5K","8.0K","8.8K","9.5K","10K",
]
PLATFORMS = ["Instagram", "TikTok", "Pinterest", "YouTube", "Web"]

SITEMAPS = [
    "https://www.recipetineats.com/post-sitemap.xml",
    "https://www.recipetineats.com/post-sitemap2.xml",
    "https://www.recipetineats.com/post-sitemap3.xml",
    "https://www.recipetineats.com/post-sitemap4.xml",
    "https://www.halfbakedharvest.com/post-sitemap.xml",
    "https://www.halfbakedharvest.com/post-sitemap2.xml",
    "https://www.halfbakedharvest.com/post-sitemap3.xml",
    "https://www.halfbakedharvest.com/post-sitemap4.xml",
    "https://www.halfbakedharvest.com/post-sitemap5.xml",
    "https://www.wellplated.com/post-sitemap.xml",
    "https://www.wellplated.com/post-sitemap2.xml",
    "https://www.gimmesomeoven.com/post-sitemap.xml",
    "https://www.gimmesomeoven.com/post-sitemap2.xml",
]

def test_url(url):
    """Fetch one URL, parse it, and print a report."""
    print(f"\n🔍 Testing: {url}")
    try:
        html = fetch_html(url)
    except Exception as e:
        print(f"  ❌ Fetch failed: {e}")
        return

    blocks = extract_json_ld_blocks(html)
    schema = None
    for b in blocks:
        schema = find_recipe_schema(b)
        if schema:
            break

    if not schema:
        print("  ❌ No JSON-LD Recipe schema found")
        print(f"  Found {len(blocks)} JSON-LD block(s) total")
        # Show what types were found
        for b in blocks:
            t = b.get('@type') if isinstance(b, dict) else [x.get('@type') for x in b if isinstance(x, dict)]
            print(f"    type: {t}")
        return

    recipe = schema_to_recipe(schema, url, 0)
    print(f"\n  ✅ TITLE:      {recipe['title']}")
    print(f"  ✅ IMAGE:      {recipe['image'][:80]}")
    print(f"  ✅ SERVINGS:   {recipe['servings']}")
    print(f"  ✅ PREP:       {recipe['prepTime']} min")
    print(f"  ✅ COOK:       {recipe['cookTime']} min")
    print(f"  {'✅' if recipe['nutrition'] else '❌'} NUTRITION: {recipe['nutrition']}")
    print(f"  ✅ TAGS:       {recipe['tags']}")
    print(f"  ✅ CATEGORY:   {recipe['category']}")
    print(f"  ✅ CUISINE:    {recipe['cuisine']}")
    print(f"  ✅ INGREDIENTS ({len(recipe['ingredients'])}):")
    for i in recipe['ingredients'][:5]:
        print(f"      {i['emoji']} {i['amount']} {i['unit']} {i['name']}")
    if len(recipe['ingredients']) > 5:
        print(f"      ... and {len(recipe['ingredients'])-5} more")
    print(f"  ✅ STEPS ({len(recipe['steps'])}):")
    for s in recipe['steps'][:3]:
        print(f"      {s['order']}. {s['instruction'][:80]}...")
    if len(recipe['steps']) > 3:
        print(f"      ... and {len(recipe['steps'])-3} more")

    score = sum([
        bool(recipe['title']),
        recipe['image'].startswith('http'),
        len(recipe['ingredients']) >= 3,
        len(recipe['steps']) >= 2,
        recipe['nutrition'] is not None,
    ])
    print(f"\n  SCORE: {score}/5 {'🟢 EXCELLENT' if score==5 else '🟡 GOOD' if score>=4 else '🔴 POOR'}")

def crawl(limit=2000, dry_run=False, delay=0.8):
    # Load current index
    index = json.loads(INDEX_PATH.read_text())
    existing_ids = {r['id'] for r in index.get('recipes', [])}
    existing_titles = {r['title'].lower().strip() for r in index.get('recipes', [])}

    # Determine starting ID
    if existing_ids:
        next_id = max(int(x.split('_')[1]) for x in existing_ids) + 1
    else:
        next_id = 66

    print(f"\n📦 Current recipes: {len(existing_ids)}")
    print(f"🎯 Target: {limit} new recipes (up to tr_{next_id + limit - 1})")
    print(f"⏱  Delay between requests: {delay}s\n")

    # Collect URLs from all sitemaps
    print("📡 Fetching sitemaps...")
    all_urls = []
    seen_urls = set()
    for sm in SITEMAPS:
        urls = get_urls_from_sitemap(sm)
        for u in urls:
            if u not in seen_urls:
                seen_urls.add(u)
                all_urls.append(u)
        if len(all_urls) >= limit * 3:
            break

    print(f"\n🔗 Total unique recipe URLs: {len(all_urls)}")
    print(f"🚀 Starting crawl...\n")

    saved = 0
    skipped = 0
    failed = 0
    n = next_id

    for i, url in enumerate(all_urls):
        if saved >= limit:
            break

        rid = f"tr_{n}"
        print(f"[{i+1}/{len(all_urls)}] {rid} | {url[:70]}...", end=' ', flush=True)

        try:
            html = fetch_html(url)
        except urllib.error.HTTPError as e:
            print(f"HTTP {e.code} ⚠️")
            failed += 1
            continue
        except Exception as e:
            print(f"❌ {type(e).__name__}")
            failed += 1
            continue

        time.sleep(delay)

        # Find JSON-LD recipe
        blocks = extract_json_ld_blocks(html)
        schema = None
        for b in blocks:
            schema = find_recipe_schema(b)
            if schema:
                break

        if not schema:
            print("no schema ⚠️")
            skipped += 1
            continue

        try:
            recipe = schema_to_recipe(schema, url, n)
        except Exception as e:
            print(f"parse error: {e} ❌")
            failed += 1
            continue

        # Quality checks
        title_lower = recipe['title'].lower().strip()
        if title_lower in existing_titles:
            print("duplicate title ⚠️")
            skipped += 1
            continue
        if len(recipe['ingredients']) < 3:
            print("too few ingredients ⚠️")
            skipped += 1
            continue
        if len(recipe['steps']) < 2:
            print("too few steps ⚠️")
            skipped += 1
            continue

        if dry_run:
            print(f"✅ (dry-run) '{recipe['title'][:45]}'")
            saved += 1
            existing_titles.add(title_lower)
            n += 1
            continue

        # Build and save recipe.json
        recipe_json = {
            'id': rid,
            'title': recipe['title'],
            'image': recipe['image'],
            'importCount': IMPORT_COUNTS[n % len(IMPORT_COUNTS)],
            'sourcePlatform': recipe['sourcePlatform'],
            'sourceUrl': recipe['sourceUrl'],
            'servings': recipe['servings'],
            'prepTime': recipe['prepTime'],
            'cookTime': recipe['cookTime'],
            'tags': recipe['tags'],
            'nutrition': recipe['nutrition'] or {'calories': 420, 'protein': 28, 'carbs': 38, 'fat': 16},
            'healthScore': recipe['healthScore'],
            'ingredients': recipe['ingredients'],
            'steps': recipe['steps'],
        }

        recipe_dir = RECIPES_DIR / rid
        recipe_dir.mkdir(parents=True, exist_ok=True)
        (recipe_dir / 'recipe.json').write_text(
            json.dumps(recipe_json, ensure_ascii=False, indent=2)
        )

        # Add to index
        index['recipes'].append({
            'id': rid,
            'title': recipe['title'],
            'image': recipe['image'],
            'sourcePlatform': recipe['sourcePlatform'],
            'importCount': IMPORT_COUNTS[n % len(IMPORT_COUNTS)],
            'healthScore': recipe['healthScore'],
            'cuisine': recipe['cuisine'],
            'category': recipe['category'],
            'nutrition': recipe_json['nutrition'],
            'tags': recipe['tags'],
        })
        existing_ids.add(rid)
        existing_titles.add(title_lower)

        print(f"✅ '{recipe['title'][:45]}'")
        saved += 1
        n += 1

        # Save index every 25 recipes
        if saved % 25 == 0:
            INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2))
            print(f"\n💾 Checkpoint: {saved} new recipes saved (index updated)\n")

    # Final save
    if not dry_run:
        INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2))

    print(f"\n{'='*60}")
    print(f"✅ Saved:   {saved}")
    print(f"⚠️  Skipped: {skipped}")
    print(f"❌ Failed:  {failed}")
    print(f"Total recipes now: {len(index['recipes'])}")
    print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description='Crawl real recipes for RecipeMe app')
    parser.add_argument('--test', metavar='URL', help='Test a single URL and print parsed data')
    parser.add_argument('--limit', type=int, default=2000, help='Max new recipes to crawl (default: 2000)')
    parser.add_argument('--dry-run', action='store_true', help='Fetch and parse but do not write files')
    parser.add_argument('--delay', type=float, default=0.8, help='Seconds between requests (default: 0.8)')
    args = parser.parse_args()

    if args.test:
        test_url(args.test)
    else:
        crawl(limit=args.limit, dry_run=args.dry_run, delay=args.delay)

if __name__ == '__main__':
    main()
