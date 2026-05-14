#!/usr/bin/env bash
set -euo pipefail

# Quick backend-only redeploy for Cloud Shell
# Usage: ./azure/redeploy-backend-only.sh

RESOURCE_GROUP="${RESOURCE_GROUP:-npc-ai-roi-app-1778762630}"
WEBAPP_NAME="${WEBAPP_NAME:-npc-ai-roi-api-1778762630}"

echo "Pulling latest code..."
git pull

echo "Packaging backend..."
rm -f backend.zip
(cd backend && zip -r ../backend.zip . -x "*.pyc" "*__pycache__*" ".env" ".venv/*")

echo "Deploying to $WEBAPP_NAME in $RESOURCE_GROUP..."
az webapp deploy \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path backend.zip \
  --type zip

echo ""
echo "✅ Backend deployed successfully!"
echo "Waiting 30s for App Service to restart..."
sleep 30

echo "Testing backend health..."
BACKEND_URL="https://${WEBAPP_NAME}.azurewebsites.net"
if curl -s "${BACKEND_URL}/health" | grep -q "ok"; then
  echo "✅ Backend is healthy!"
else
  echo "⚠️ Backend health check failed. Deployment may still be initializing."
fi

echo ""
echo "Done! Refresh your browser at:"
echo "https://npcairoi762630.z1.web.core.windows.net/evaluate"
