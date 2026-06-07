#!/usr/bin/env bash
# Scaffold a new static site folder that's ready to deploy to GitHub Pages.
#
# Usage: new-site.sh <site-name> [target-dir]
#
# Creates <target-dir> (defaults to <site-name>) containing:
#   - index.html            a minimal valid placeholder (REPLACE it — don't ship it)
#   - .github/workflows/deploy-pages.yml   the auto-deploy workflow
#
# Preview locally with:  (cd <target-dir> && python3 -m http.server 8000)
set -euo pipefail

NAME="${1:?usage: new-site.sh <site-name> [target-dir]}"
DIR="${2:-$NAME}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$DIR/.github/workflows"
cp "$SKILL_DIR/assets/deploy-pages.yml" "$DIR/.github/workflows/deploy-pages.yml"

if [ ! -f "$DIR/index.html" ]; then
  cat > "$DIR/index.html" <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${NAME}</title>
</head>
<body>
  <!-- Placeholder. Design the real site here and delete this comment.
       Use RELATIVE asset paths (./style.css, assets/...) so links work
       at https://<user>.github.io/${NAME}/ . -->
</body>
</html>
HTML
fi

echo "Scaffolded ./$DIR"
echo "  - index.html (placeholder — replace with the real design)"
echo "  - .github/workflows/deploy-pages.yml (auto-deploy on push to main)"
echo "Preview:  (cd \"$DIR\" && python3 -m http.server 8000)"
