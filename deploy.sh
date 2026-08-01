#!/bin/bash
# Deploy Fanboy Stock: clasp deploy → update index.html → push GitHub
set -e

PROJECT_DIR="/home/bgs/fanboy-stock"
cd "$PROJECT_DIR"

# GitHub token (read from file)
TOKEN_FILE="$HOME/.github_token"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "ERROR: Token file not found at $TOKEN_FILE"
  echo "Create it with: echo 'ghp_YOUR_TOKEN' > ~/.github_token && chmod 600 ~/.github_token"
  exit 1
fi
GH_TOKEN=$(cat "$TOKEN_FILE")
GH_USER="fanboygadget-dot"
GH_REPO="fanboy-stock"

# Set remote with token
git remote set-url origin "https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${GH_REPO}.git"

echo "=== Step 1: clasp push ==="
clasp push 2>&1

echo ""
echo "=== Step 2: clasp deploy ==="
DEPLOY_OUTPUT=$(clasp deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract deployment ID from output
DEPLOY_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '- \K[A-Za-z0-9_-]+(?=\s|$)' | tail -1)
if [ -z "$DEPLOY_ID" ]; then
  echo "WARNING: Could not extract deployment ID from clasp output"
  echo "Trying alternative parse..."
  DEPLOY_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP 'AKfyc[a-zA-Z0-9_-]+' | tail -1)
fi

SCRIPT_ID=$(python3 -c "import json; print(json.load(open('.clasp.json'))['scriptId'])")
DEPLOY_URL="https://script.google.com/macros/s/AKfycbyWn03T0CxzkPNQh892D59gnfNpYMm5TsuL0ULNV7M9Rv5xFbvdlYWwcjWnU8F_q4kr/exec"

echo ""
echo "=== Step 3: Update index.html with new URL ==="
echo "New deploy URL: $DEPLOY_URL"

# Update index.html
sed -i "s|https://script.google.com/macros/s/AKfycbyWn03T0CxzkPNQh892D59gnfNpYMm5TsuL0ULNV7M9Rv5xFbvdlYWwcjWnU8F_q4kr/exec|${DEPLOY_URL}|" index.html
# Also update the display text link
sed -i "s|href=\"https://script.google.com/macros/s/[^\"]*\"|href=\"${DEPLOY_URL}\"|" index.html

echo ""
echo "=== Step 4: Git commit & push ==="
git add -A
git diff --cached --quiet && echo "No changes to commit" && exit 0
git commit -m "deploy: update Apps Script URL to @HEAD" 2>&1
git push origin main 2>&1

echo ""
echo "=== DONE ==="
echo "GitHub Pages will auto-deploy in ~1-2 minutes"
echo "URL: https://${GH_USER}.github.io/${GH_REPO}/"
