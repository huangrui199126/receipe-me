#!/usr/bin/env python3
"""Patch recipe cover images — only using verified valid Unsplash photo IDs.

Verification method: HTTP HEAD requests to images.unsplash.com from browser
(Chrome fetch API) — confirmed 44 IDs return HTTP 200 as of 2026-04-24.
"""
import json, pathlib

OUT = pathlib.Path(__file__).parent.parent / "docs" / "data"
RECIPES_DIR = OUT / "recipes"
IMG = lambda id: f"https://images.unsplash.com/photo-{id}?w=600&q=80"

# ---------------------------------------------------------------------------
# 44 verified valid Unsplash food photo IDs (HEAD → HTTP 200, 2026-04-24)
# ---------------------------------------------------------------------------
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

POOL = [IMG(id) for id in VERIFIED_IDS]
N = len(POOL)  # 44


def assign_images():
    """Assign images to all recipe dirs, cycling through the full verified pool."""
    recipe_dirs = sorted(
        [p for p in RECIPES_DIR.iterdir() if p.is_dir() and (p / "recipe.json").exists()],
        key=lambda p: int(p.name.replace("tr_", ""))
    )

    id_map = {}
    patched = 0
    for i, rdir in enumerate(recipe_dirs):
        rjson = rdir / "recipe.json"
        data = json.loads(rjson.read_text())
        new_img = POOL[i % N]
        data["image"] = new_img
        rjson.write_text(json.dumps(data, ensure_ascii=False, indent=2))
        id_map[data["id"]] = new_img
        patched += 1

    # Update index.json
    index_path = OUT / "index.json"
    index = json.loads(index_path.read_text())
    updated = 0
    for entry in index["recipes"]:
        if entry["id"] in id_map:
            entry["image"] = id_map[entry["id"]]
            updated += 1
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2))

    import collections
    used = collections.Counter(id_map.values())
    print(f"Patched {patched} recipe.json files, updated {updated} index entries.")
    print(f"Pool: {N} verified IDs | repeats: min={min(used.values())}x max={max(used.values())}x per image")


if __name__ == "__main__":
    assign_images()
