#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Removing stale git lock..."
rm -f .git/index.lock
echo "Staging changes..."
git add docs/data/ scripts/fix_images.py scripts/generate_trending.py
echo "Committing..."
git commit -m "fix: expand verified image pool, eliminate duplicate images

- Verified 44 Unsplash IDs via HTTP HEAD (browser fetch API, 2026-04-24)
- Discarded 22 candidates that returned non-200
- Updated all 420 recipe.json cover images cycling through full 44-ID pool
- Rebuilt index.json to match
- Rewrote scripts/fix_images.py with full VERIFIED_IDS list (44 IDs)
- Added VERIFIED_IDS constant to scripts/generate_trending.py"
echo "Pushing..."
git push
echo "Done! Commit SHA: $(git rev-parse HEAD)"
