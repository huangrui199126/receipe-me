#!/usr/bin/env python3
"""
Sanity check: test which recipe sites return complete data via schema.org JSON-LD.
Run this from the terminal: python3 scripts/crawl_test.py

Checks each site for: title ✓ | image ✓ | ingredients ✓ | steps ✓ | nutrition ✓
"""
import urllib.request, json, re, time

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode("utf-8", errors="ignore")

def extract_recipe(html):
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', html, re.DOTALL):
        try:
            d = json.loads(m.group(1))
            items = d.get("@graph", [d]) if isinstance(d, dict) else d
            for item in (items if isinstance(items, list) else [items]):
                if "Recipe" in str(item.get("@type", "")):
                    return item
        except:
            pass
    return None

def score(r, url, site):
    if not r:
        return {"site": site, "url": url, "ok": False, "score": 0, "reason": "No JSON-LD Recipe found"}

    img = r.get("image", "")
    if isinstance(img, list): img = img[0] if img else ""
    if isinstance(img, dict): img = img.get("url", "")

    ingr  = r.get("recipeIngredient", [])
    steps = r.get("recipeInstructions", [])
    nutr  = r.get("nutrition", {})
    cal   = nutr.get("calories", "") if isinstance(nutr, dict) else ""

    checks = {
        "title":       bool(r.get("name")),
        "image":       bool(img) and img.startswith("http"),
        "ingredients": len(ingr) >= 3,
        "steps":       len(steps) >= 2,
        "nutrition":   bool(nutr and cal),
    }
    sc = sum(checks.values())

    return {
        "site":       site,
        "url":        url,
        "ok":         True,
        "score":      sc,
        "checks":     checks,
        "title":      r.get("name", "")[:55],
        "image":      (img or "")[:80],
        "n_ingr":     len(ingr),
        "n_steps":    len(steps),
        "calories":   cal,
        "sample_ingr": ingr[:2] if ingr else [],
    }

# ── Test URLs ─────────────────────────────────────────────────────────────────
TESTS = [
    ("AllRecipes",    "https://www.allrecipes.com/recipe/8652/chocolate-chip-cookies/"),
    ("AllRecipes",    "https://www.allrecipes.com/recipe/234410/one-pan-orecchiette-pasta/"),
    ("BBC Good Food", "https://www.bbcgoodfood.com/recipes/easy-chicken-curry"),
    ("BBC Good Food", "https://www.bbcgoodfood.com/recipes/classic-french-omelette"),
    ("Delish",        "https://www.delish.com/cooking/recipe-ideas/a19636089/best-chocolate-chip-cookies-recipe/"),
    ("Simply Recipes","https://www.simplyrecipes.com/recipes/homemade_pizza/"),
    ("Serious Eats",  "https://www.seriouseats.com/best-chicken-parmesan-recipe"),
    ("Food52",        "https://food52.com/recipes/80554-creamy-mushroom-pasta"),
    ("Skinnytaste",   "https://www.skinnytaste.com/air-fryer-chicken-breast/"),
    ("Minimalist Baker","https://minimalistbaker.com/simple-vegan-banana-bread/"),
    ("Cookie & Kate", "https://cookieandkate.com/simple-green-salad/"),
    ("Tasty",         "https://tasty.co/recipe/the-best-homemade-pizza"),
]

print("Testing recipe sources for JSON-LD completeness...\n")
results = []
for site, url in TESTS:
    print(f"  {site}: {url.split('/')[2]}...", end=" ", flush=True)
    try:
        html = fetch(url)
        r = extract_recipe(html)
        res = score(r, url, site)
        results.append(res)
        if res["ok"]:
            checks = res["checks"]
            marks = "".join("✓" if v else "✗" for v in checks.values())
            print(f"{res['score']}/5 [{marks}] \"{res['title']}\"")
        else:
            print(f"✗ {res['reason']}")
    except Exception as e:
        print(f"✗ ERROR: {e}")
        results.append({"site": site, "url": url, "ok": False, "score": 0, "reason": str(e)})
    time.sleep(0.8)

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("SUMMARY  (title | image | ingredients | steps | nutrition)")
print("="*60)
by_site = {}
for r in results:
    by_site.setdefault(r["site"], []).append(r)

for site, rs in sorted(by_site.items(), key=lambda x: -max(r["score"] for r in x[1])):
    avg = sum(r["score"] for r in rs) / len(rs)
    best = max(rs, key=lambda r: r["score"])
    checks = best.get("checks", {})
    marks = "".join("✓" if checks.get(k) else "✗" for k in ["title","image","ingredients","steps","nutrition"])
    print(f"  {site:20} avg={avg:.1f}/5  [{marks}]  n_ingr={best.get('n_ingr',0)} cal={best.get('calories','?')}")

print("\nBest sources for bulk crawling: look for 5/5 with ✓ on all fields.")
print("Sites with nutrition data are especially valuable for the app's health score feature.")
