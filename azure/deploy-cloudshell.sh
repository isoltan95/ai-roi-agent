#!/usr/bin/env bash
set -euo pipefail

# Subscription-scope deployment only (no tenant-level operations).
# Run in Azure Cloud Shell (Bash) from repo root.

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI (az) is required."
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required. Install it in Cloud Shell image or use a shell with zip available."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to build frontend."
  exit 1
fi

# ---- Required inputs ----
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-}"
RESOURCE_GROUP="${RESOURCE_GROUP:-npc-ai-roi-rg}"
LOCATION="${LOCATION:-qatarcentral}"

# Existing Azure OpenAI account (subscription-scope resources)
AOAI_RESOURCE_GROUP="${AOAI_RESOURCE_GROUP:-}"
AOAI_ACCOUNT_NAME="${AOAI_ACCOUNT_NAME:-}"
AOAI_DEPLOYMENT="${AOAI_DEPLOYMENT:-gpt-4o}"
AOAI_API_VERSION="${AOAI_API_VERSION:-2024-02-01}"

# Optional names (auto-generated if empty)
WEBAPP_NAME="${WEBAPP_NAME:-npc-ai-roi-api-$(date +%s)}"
PLAN_NAME="${PLAN_NAME:-npc-ai-roi-plan}"
STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME:-npcairoi$(date +%s | tail -c 7)}"

if [[ -z "$SUBSCRIPTION_ID" ]]; then
  echo "Set SUBSCRIPTION_ID before running."
  exit 1
fi

if [[ -z "$AOAI_RESOURCE_GROUP" || -z "$AOAI_ACCOUNT_NAME" ]]; then
  echo "Set AOAI_RESOURCE_GROUP and AOAI_ACCOUNT_NAME before running."
  exit 1
fi

ROOT_DIR="$(pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" ]]; then
  echo "Run this script from repository root containing backend/ and frontend/."
  exit 1
fi

echo "Selecting subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

echo "Creating resource group (if needed)..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

echo "Reading Azure OpenAI endpoint and key..."
AOAI_ENDPOINT="$(az cognitiveservices account show \
  --resource-group "$AOAI_RESOURCE_GROUP" \
  --name "$AOAI_ACCOUNT_NAME" \
  --query properties.endpoint -o tsv)"

AOAI_KEY="$(az cognitiveservices account keys list \
  --resource-group "$AOAI_RESOURCE_GROUP" \
  --name "$AOAI_ACCOUNT_NAME" \
  --query key1 -o tsv)"

if [[ -z "$AOAI_ENDPOINT" || -z "$AOAI_KEY" ]]; then
  echo "Could not retrieve Azure OpenAI endpoint/key. Check RBAC access to the AOAI resource."
  exit 1
fi

echo "Creating App Service plan and Web App..."
az appservice plan create \
  --name "$PLAN_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku B1 \
  --is-linux \
  --output none

az webapp create \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$PLAN_NAME" \
  --runtime "PYTHON:3.11" \
  --output none

echo "Configuring backend app settings..."
az webapp config appsettings set \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    AZURE_OPENAI_ENDPOINT="$AOAI_ENDPOINT" \
    AZURE_OPENAI_API_KEY="$AOAI_KEY" \
    AZURE_OPENAI_DEPLOYMENT="$AOAI_DEPLOYMENT" \
    AZURE_OPENAI_API_VERSION="$AOAI_API_VERSION" \
  --output none

az webapp config set \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file 'python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}' \
  --output none

echo "Packaging backend..."
rm -f "$ROOT_DIR/backend.zip"
(
  cd "$BACKEND_DIR"
  zip -r "$ROOT_DIR/backend.zip" . \
    -x "*.pyc" "*__pycache__*" ".env" ".venv/*"
)

echo "Deploying backend package..."
az webapp deploy \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path "$ROOT_DIR/backend.zip" \
  --type zip \
  --output none

BACKEND_URL="https://${WEBAPP_NAME}.azurewebsites.net"

echo "Creating storage account for frontend static hosting..."
az storage account create \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true \
  --min-tls-version TLS1_2 \
  --output none

az storage blob service-properties update \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --static-website \
  --index-document index.html \
  --404-document index.html \
  --auth-mode login \
  --output none

echo "Allowing frontend origin on backend CORS..."
STATIC_ENDPOINT="$(az storage account show \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query 'primaryEndpoints.web' -o tsv)"

az webapp cors add \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --allowed-origins "$STATIC_ENDPOINT" \
  --output none || true

echo "Building frontend with production API URL..."
cat > "$FRONTEND_DIR/.env.production" <<EOF
VITE_API_BASE_URL=${BACKEND_URL}
EOF

(
  cd "$FRONTEND_DIR"
  npm install
  npm run build
)

echo "Uploading frontend static files..."
az storage blob upload-batch \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --destination '$web' \
  --source "$FRONTEND_DIR/dist" \
  --auth-mode login \
  --overwrite \
  --output none

echo "\nDeployment complete."
echo "----------------------------------------"
echo "Frontend URL: ${STATIC_ENDPOINT}"
echo "Backend URL:  ${BACKEND_URL}"
echo "\nBackend environment values in Azure App Service:"
echo "AZURE_OPENAI_ENDPOINT=${AOAI_ENDPOINT}"
echo "AZURE_OPENAI_DEPLOYMENT=${AOAI_DEPLOYMENT}"
echo "AZURE_OPENAI_API_VERSION=${AOAI_API_VERSION}"
echo "AZURE_OPENAI_API_KEY=<stored in App Service settings>"
echo "VITE_API_BASE_URL=${BACKEND_URL}"

echo "\nTo verify app settings from Azure:"
echo "az webapp config appsettings list -g ${RESOURCE_GROUP} -n ${WEBAPP_NAME} --query \"[].{name:name,value:value}\" -o table"
