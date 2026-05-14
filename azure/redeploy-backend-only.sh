#!/usr/bin/env bash
set -euo pipefail

# Quick backend-only redeploy for Cloud Shell
# Usage: ./azure/redeploy-backend-only.sh

RESOURCE_GROUP="${RESOURCE_GROUP:-npc-ai-roi-app-1778762630}"
WEBAPP_NAME="${WEBAPP_NAME:-npc-ai-roi-api-1778762630}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-https://npcairoi762630.z1.web.core.windows.net}"

echo "Pulling latest code..."
git pull

echo "Setting backend CORS frontend origin..."
az webapp config appsettings set \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings FRONTEND_ORIGIN="$FRONTEND_ORIGIN" \
  --output none

echo "Setting App Service platform CORS fallback..."
az webapp cors add \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --allowed-origins "$FRONTEND_ORIGIN" \
  --output none || true

echo "Packaging backend..."
rm -f backend.zip
(cd backend && zip -r ../backend.zip . -x "*.pyc" "*__pycache__*" ".env" ".venv/*")

echo "Deploying to $WEBAPP_NAME in $RESOURCE_GROUP..."
az webapp deploy \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path backend.zip \
  --type zip

echo "Restarting web app to ensure new settings are loaded..."
az webapp restart \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

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

echo "Checking CORS header for frontend origin..."
if curl -s -i -H "Origin: ${FRONTEND_ORIGIN}" "${BACKEND_URL}/api/sectors" | grep -iq "access-control-allow-origin"; then
  echo "✅ CORS header is present."
else
  echo "⚠️ CORS header is still missing. Check app logs and app settings."
fi

echo ""
echo "Done! Refresh your browser at:"
echo "https://npcairoi762630.z1.web.core.windows.net/evaluate"
