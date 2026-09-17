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
echo "=== Step 2: clasp deploy (update existing or create) ==="
# Ambil deployment ID yang saat ini dipakai di index.html (jika ada)
CURRENT_ID=$(grep -oE 'AKfycb[a-zA-Z0-9_-]+' index.html | head -1)

if [ -n "$CURRENT_ID" ] && clasp deployments 2>/dev/null | grep -q "$CURRENT_ID"; then
  echo "Updating existing deployment: $CURRENT_ID"
  DEPLOY_OUTPUT=$(clasp deploy --deploymentId "$CURRENT_ID" 2>&1)
else
  echo "Creating new deployment (current: ${CURRENT_ID:-none})"
  DEPLOY_OUTPUT=$(clasp deploy 2>&1)
fi
echo "$DEPLOY_OUTPUT"

# Extract deployment ID (AKfycb...) — dari output clasp atau fallback ke current
DEPLOY_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE 'AKfycb[a-zA-Z0-9_-]+' | head -1)
if [ -z "$DEPLOY_ID" ] && [ -n "$CURRENT_ID" ]; then
  DEPLOY_ID="$CURRENT_ID"
fi
if [ -z "$DEPLOY_ID" ]; then
  echo "ERROR: Could not extract deployment ID from clasp output"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi
DEPLOY_URL="https://script.google.com/macros/s/${DEPLOY_ID}/exec"

echo ""
echo "=== Step 3: Update index.html with new URL ==="
echo "New deploy URL: $DEPLOY_URL"

# Update window.location.replace(...) — generic, match URL apa pun
sed -i "s|window.location.replace(\"https://script.google.com/macros/s/[^\"]*\")|window.location.replace(\"${DEPLOY_URL}\")|" index.html
# Update link display href
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
