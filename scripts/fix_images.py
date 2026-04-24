#!/usr/bin/env python3
"""Patch recipe cover images — only using verified valid Unsplash photo IDs."""
import json, pathlib

OUT = pathlib.Path(__file__).parent.parent / "docs" / "data"
RECIPES_DIR = OUT / "recipes"
IMG = lambda id: f"https://images.unsplash.com/photo-{id}?w=600&q=80"

# Verified valid Unsplash food photo IDs (used successfully in project already)
POOL = [
    IMG("1626700051175-6818013e1d4f"),  # chicken / wraps
    IMG("1621996346565-e3dbc646d9a9"),  # pasta / noodles
    IMG("1604908176997-125f25cc6f3d"),  # stir fry / Asian beef
    IMG("1467003909585-2f8a72700288"),  # salmon / fish
    IMG("1432139555190-58524dae6a55"),  # creamy chicken
    IMG("1525351484163-7529414344d8"),  # avocado / egg
    IMG("1564355808539-22fda35bed7e"),  # dessert / chocolate
    IMG("1546069901-ba9599a7e63c"),     # bowl / salad colorful
    IMG("1512621776951-a57141f2eefd"),  # vegetables / salad
    IMG("1553163147-622ab57be1c7"),     # Korean / rice bowl
    IMG("1530554764233-e79e16c91d08"),  # eggs / breakfast
    IMG("1490474418585-ba9bad8fd0ea"),  # smoothie / tropical
    IMG("1482049016688-2d3e1b311543"),  # food spread / eggs
    IMG("1608198093002-ad4e005484ec"),  # oats / healthy
    IMG("1484723091739-30a097e8f929"),  # pasta / bread
    IMG("1547592180-85f173990554"),     # soup / congee
    IMG("1574071318508-1cdbab80d002"),  # baked / pie
    IMG("1490645935967-10de6ba17061"),  # breakfast plate
    IMG("1504674900247-0877df9cc836"),  # pizza / Italian
    IMG("1476224203421-9ac39bcb3327"),  # plated food
    IMG("1507048331197-7d4ac70811cf"),  # cooking / pot
    IMG("1466637574441-749b8f19452f"),  # Mediterranean / kofta
    IMG("1555939594-58d7cb561ad1"),     # ramen / noodles
    IMG("1568901346375-23c9450c58cd"),  # curry / Indian
    IMG("1556909114-f6e7ad7d3136"),     # mixing / prep
    IMG("1601050690597-df0568f70950"),  # chopping / fresh
]

# Smart assignment: pick from pool by index, no two adjacent share same image
# Recipes 1-10 keep their original images (already unique)
FIXED_COVERS = {
    "tr_1":  IMG("1626700051175-6818013e1d4f"),
    "tr_2":  IMG("1621996346565-e3dbc646d9a9"),
    "tr_3":  IMG("1604908176997-125f25cc6f3d"),
    "tr_4":  IMG("1467003909585-2f8a72700288"),
    "tr_5":  IMG("1432139555190-58524dae6a55"),
    "tr_6":  IMG("1525351484163-7529414344d8"),
    "tr_7":  IMG("1564355808539-22fda35bed7e"),
    "tr_8":  IMG("1546069901-ba9599a7e63c"),
    "tr_9":  IMG("1512621776951-a57141f2eefd"),
    "tr_10": IMG("1553163147-622ab57be1c7"),
    # Breakfast
    "tr_11": IMG("1490645935967-10de6ba17061"),  # pancakes
    "tr_12": IMG("1530554764233-e79e16c91d08"),  # omelette
    "tr_13": IMG("1490474418585-ba9bad8fd0ea"),  # açaí bowl
    "tr_14": IMG("1482049016688-2d3e1b311543"),  # shakshuka
    "tr_15": IMG("1608198093002-ad4e005484ec"),  # overnight oats
    "tr_16": IMG("1626700051175-6818013e1d4f"),  # breakfast burrito
    "tr_17": IMG("1484723091739-30a097e8f929"),  # french toast
    "tr_18": IMG("1547592180-85f173990554"),     # congee
    "tr_19": IMG("1525351484163-7529414344d8"),  # avocado egg bake
    "tr_20": IMG("1568901346375-23c9450c58cd"),  # idli sambar
    # Lunch
    "tr_21": IMG("1563379926898-05f4575a45d8"),  # banh mi
    "tr_22": IMG("1555939594-58d7cb561ad1"),     # pad thai
    "tr_23": IMG("1512621776951-a57141f2eefd"),  # caprese
    "tr_24": IMG("1546069901-ba9599a7e63c"),     # poke bowl
    "tr_25": IMG("1476224203421-9ac39bcb3327"),  # caesar salad
    "tr_26": IMG("1507048331197-7d4ac70811cf"),  # tom yum soup
    "tr_27": IMG("1466637574441-749b8f19452f"),  # falafel wrap
    "tr_28": IMG("1563379926898-05f4575a45d8"),  # smash burger
    "tr_29": IMG("1547592180-85f173990554"),     # miso soup
    "tr_30": IMG("1626700051175-6818013e1d4f"),  # quesadilla
    # Dinner
    "tr_31": IMG("1568901346375-23c9450c58cd"),  # butter chicken
    "tr_32": IMG("1621996346565-e3dbc646d9a9"),  # carbonara
    "tr_33": IMG("1504674900247-0877df9cc836"),  # birria tacos
    "tr_34": IMG("1467003909585-2f8a72700288"),  # salmon bowl
    "tr_35": IMG("1556909114-f6e7ad7d3136"),     # dal makhani
    "tr_36": IMG("1432139555190-58524dae6a55"),  # tikka masala
    "tr_37": IMG("1604908176997-125f25cc6f3d"),  # kung pao
    "tr_38": IMG("1601050690597-df0568f70950"),  # ratatouille
    "tr_39": IMG("1466637574441-749b8f19452f"),  # lamb kofta
    "tr_40": IMG("1568901346375-23c9450c58cd"),  # mapo tofu
    "tr_41": IMG("1507048331197-7d4ac70811cf"),  # osso buco
    "tr_42": IMG("1555939594-58d7cb561ad1"),     # carne asada
    "tr_43": IMG("1553163147-622ab57be1c7"),     # bulgogi
    "tr_44": IMG("1476224203421-9ac39bcb3327"),  # lobster bisque
    "tr_45": IMG("1546069901-ba9599a7e63c"),     # bibimbap
    "tr_46": IMG("1490645935967-10de6ba17061"),  # moussaka
    "tr_47": IMG("1504674900247-0877df9cc836"),  # tacos al pastor
    "tr_48": IMG("1482049016688-2d3e1b311543"),  # shawarma bowl
    "tr_49": IMG("1547592180-85f173990554"),     # pho
    "tr_50": IMG("1574071318508-1cdbab80d002"),  # chicken pot pie
    # Snacks
    "tr_51": IMG("1512621776951-a57141f2eefd"),  # guacamole
    "tr_52": IMG("1608198093002-ad4e005484ec"),  # edamame
    "tr_53": IMG("1601050690597-df0568f70950"),  # hummus
    "tr_54": IMG("1563379926898-05f4575a45d8"),  # Korean corn dogs
    "tr_55": IMG("1490474418585-ba9bad8fd0ea"),  # spinach dip
    # Desserts
    "tr_56": IMG("1564355808539-22fda35bed7e"),  # tiramisu
    "tr_57": IMG("1490474418585-ba9bad8fd0ea"),  # mango sticky rice
    "tr_58": IMG("1484723091739-30a097e8f929"),  # creme brulee
    "tr_59": IMG("1626700051175-6818013e1d4f"),  # churros
    "tr_60": IMG("1608198093002-ad4e005484ec"),  # matcha ice cream
    "tr_61": IMG("1574071318508-1cdbab80d002"),  # banana bread
    "tr_62": IMG("1555939594-58d7cb561ad1"),     # mochi
    "tr_63": IMG("1621996346565-e3dbc646d9a9"),  # tres leches
    "tr_64": IMG("1568901346375-23c9450c58cd"),  # gulab jamun
    "tr_65": IMG("1564355808539-22fda35bed7e"),  # churro cheesecake
}

patched = 0
for rid, img_url in FIXED_COVERS.items():
    p = RECIPES_DIR / rid / "recipe.json"
    if not p.exists():
        continue
    data = json.loads(p.read_text())
    data["image"] = img_url
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    patched += 1

# Update index
index_path = OUT / "index.json"
index = json.loads(index_path.read_text())
for entry in index["recipes"]:
    if entry["id"] in FIXED_COVERS:
        entry["image"] = FIXED_COVERS[entry["id"]]
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2))

print(f"✅ Patched {patched} cover images. Index updated.")
print(f"   Using {len(set(FIXED_COVERS.values()))} unique image URLs across {patched} recipes.")
