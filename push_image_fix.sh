#!/bin/bash
# Finish the image-fix commit and push
cd "$(dirname "$0")"

# Remove stale lock if present (left by a prior interrupted process)
rm -f .git/index.lock

git config user.email "rui.huang.life@gmail.com"
git config user.name "Rui"

git add docs/data/
git commit -m "fix: use verified image pool, eliminate duplicates across 420 recipes"
git push

echo ""
echo "Done! Commit SHA: $(git rev-parse HEAD)"
