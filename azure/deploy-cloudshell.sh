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
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-bb31a276-e508-4d93-b8ab-12b8d4823c62}"

# Generate a unique suffix by default so each run can create a fresh environment.
DEPLOY_SUFFIX="${DEPLOY_SUFFIX:-$(date +%s)}"
RESOURCE_GROUP="${RESOURCE_GROUP:-npc-ai-roi-app-${DEPLOY_SUFFIX}}"
LOCATION="${LOCATION:-swedencentral}"

# Azure OpenAI options
# If CREATE_AOAI_RESOURCE=true, script can create account + deployment.
CREATE_AOAI_RESOURCE="${CREATE_AOAI_RESOURCE:-true}"
CREATE_AOAI_DEPLOYMENT="${CREATE_AOAI_DEPLOYMENT:-true}"

# Existing/target Azure OpenAI account details
AOAI_RESOURCE_GROUP="${AOAI_RESOURCE_GROUP:-npc-ai-roi-aoai-${DEPLOY_SUFFIX}}"
AOAI_ACCOUNT_NAME="${AOAI_ACCOUNT_NAME:-aoainpc${DEPLOY_SUFFIX}}"
AOAI_LOCATION="${AOAI_LOCATION:-$LOCATION}"
AOAI_SKU="${AOAI_SKU:-S0}"

# Model deployment details
AOAI_DEPLOYMENT="${AOAI_DEPLOYMENT:-gpt-4o}"
AOAI_API_VERSION="${AOAI_API_VERSION:-2024-02-01}"
AOAI_MODEL_NAME="${AOAI_MODEL_NAME:-gpt-4o}"
AOAI_MODEL_VERSION="${AOAI_MODEL_VERSION:-2024-11-20}"
AOAI_MODEL_FORMAT="${AOAI_MODEL_FORMAT:-OpenAI}"
AOAI_DEPLOYMENT_SKU_NAME="${AOAI_DEPLOYMENT_SKU_NAME:-Standard}"
AOAI_DEPLOYMENT_SKU_CAPACITY="${AOAI_DEPLOYMENT_SKU_CAPACITY:-1}"

# Optional names (auto-generated if empty)
WEBAPP_NAME="${WEBAPP_NAME:-npc-ai-roi-api-$(date +%s)}"
PLAN_NAME="${PLAN_NAME:-npc-ai-roi-plan}"
STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME:-npcairoi$(date +%s | tail -c 7)}"

if [[ -z "$SUBSCRIPTION_ID" ]]; then
  echo "Set SUBSCRIPTION_ID before running."
  exit 1
fi

ROOT_DIR="$(pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" ]]; then
  echo "Run this script from repository root containing backend/ and frontend/."
  exit 1
fi

ensure_rg_location() {
  local rg_name="$1"
  local desired_location="$2"
  local rg_label="$3"

  if az group show --name "$rg_name" --query name -o tsv >/dev/null 2>&1; then
    local existing_location
    existing_location="$(az group show --name "$rg_name" --query location -o tsv)"
    if [[ "$existing_location" != "$desired_location" ]]; then
      echo ""
      echo "ERROR: ${rg_label} resource group location mismatch."
      echo "- Resource group: $rg_name"
      echo "- Existing location: $existing_location"
      echo "- Requested location: $desired_location"
      echo ""
      echo "Resource group locations are immutable in Azure."
      echo "Choose one of these options and rerun:"
      echo "1) Use a NEW resource group name for $desired_location"
      echo "2) Keep this resource group and set location to $existing_location"
      exit 1
    fi
  fi
}

echo "Selecting subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

ensure_rg_location "$RESOURCE_GROUP" "$LOCATION" "Application"
if [[ "$CREATE_AOAI_RESOURCE" == "true" ]]; then
  ensure_rg_location "$AOAI_RESOURCE_GROUP" "$AOAI_LOCATION" "AOAI"
fi

echo "Creating resource group (if needed)..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

if [[ "$CREATE_AOAI_RESOURCE" == "true" ]]; then
  echo "Creating Azure OpenAI resource group (if needed)..."
  az group create \
    --name "$AOAI_RESOURCE_GROUP" \
    --location "$AOAI_LOCATION" \
    --output none

  # For fresh provisioning, force a unique AOAI account/custom-domain name per run
  # to avoid global subdomain collisions and stale shell env values.
  if [[ "$AOAI_ACCOUNT_NAME" != *"-${DEPLOY_SUFFIX}"* ]]; then
    AOAI_ACCOUNT_NAME="${AOAI_ACCOUNT_NAME}-${DEPLOY_SUFFIX}"
  fi
  echo "Using AOAI account name: $AOAI_ACCOUNT_NAME"

  if az cognitiveservices account show \
    --resource-group "$AOAI_RESOURCE_GROUP" \
    --name "$AOAI_ACCOUNT_NAME" \
    --output none 2>/dev/null; then
    echo "Azure OpenAI account already exists: $AOAI_ACCOUNT_NAME"
  else
    echo "Creating Azure OpenAI account..."
    BASE_AOAI_ACCOUNT_NAME="$AOAI_ACCOUNT_NAME"
    AOAI_CREATED=false
    for attempt in 1 2 3 4 5; do
      if [[ "$attempt" -gt 1 ]]; then
        # Retry with a unique suffix if name/custom-domain is already taken.
        AOAI_ACCOUNT_NAME="${BASE_AOAI_ACCOUNT_NAME}-${DEPLOY_SUFFIX}-${attempt}"
        echo "Retrying with AOAI account name: $AOAI_ACCOUNT_NAME"
      fi

      if az cognitiveservices account create \
        --name "$AOAI_ACCOUNT_NAME" \
        --resource-group "$AOAI_RESOURCE_GROUP" \
        --location "$AOAI_LOCATION" \
        --kind OpenAI \
        --sku "$AOAI_SKU" \
        --custom-domain "$AOAI_ACCOUNT_NAME" \
        --yes \
        --output none; then
        AOAI_CREATED=true
        break
      fi
    done

    if [[ "$AOAI_CREATED" != "true" ]]; then
      echo "Failed to create Azure OpenAI account after multiple name attempts."
      echo "Set AOAI_ACCOUNT_NAME to a unique value and rerun."
      exit 1
    fi
  fi
fi

if [[ "$CREATE_AOAI_DEPLOYMENT" == "true" ]]; then
  if az cognitiveservices account deployment show \
    --name "$AOAI_ACCOUNT_NAME" \
    --resource-group "$AOAI_RESOURCE_GROUP" \
    --deployment-name "$AOAI_DEPLOYMENT" \
    --output none 2>/dev/null; then
    echo "Azure OpenAI deployment already exists: $AOAI_DEPLOYMENT"
  else
    echo "Creating Azure OpenAI model deployment..."
    az cognitiveservices account deployment create \
      --name "$AOAI_ACCOUNT_NAME" \
      --resource-group "$AOAI_RESOURCE_GROUP" \
      --deployment-name "$AOAI_DEPLOYMENT" \
      --model-name "$AOAI_MODEL_NAME" \
      --model-version "$AOAI_MODEL_VERSION" \
      --model-format "$AOAI_MODEL_FORMAT" \
      --sku-name "$AOAI_DEPLOYMENT_SKU_NAME" \
      --sku-capacity "$AOAI_DEPLOYMENT_SKU_CAPACITY" \
      --output none
  fi
fi

echo "Reading Azure OpenAI endpoint..."
AOAI_ENDPOINT="$(az cognitiveservices account show \
  --resource-group "$AOAI_RESOURCE_GROUP" \
  --name "$AOAI_ACCOUNT_NAME" \
  --query properties.endpoint -o tsv)"

if [[ -z "$AOAI_ENDPOINT" ]]; then
  echo "Could not retrieve Azure OpenAI endpoint. Check RBAC access to the AOAI resource."
  exit 1
fi

# Try to enable local auth (API keys) so we can retrieve a key.
# This is a no-op if already enabled.
echo "Enabling local auth on Azure OpenAI account (required for API key retrieval)..."
az cognitiveservices account update \
  --name "$AOAI_ACCOUNT_NAME" \
  --resource-group "$AOAI_RESOURCE_GROUP" \
  --set properties.disableLocalAuth=false \
  --output none 2>/dev/null || echo "Warning: Could not enable local auth. Will attempt keyless auth."

AOAI_KEY="$(az cognitiveservices account keys list \
  --resource-group "$AOAI_RESOURCE_GROUP" \
  --name "$AOAI_ACCOUNT_NAME" \
  --query key1 -o tsv 2>/dev/null || true)"

if [[ -z "$AOAI_KEY" ]]; then
  echo "API key not available (disableLocalAuth may still be true). Deploying with keyless Azure AD auth."
  USE_KEYLESS_AUTH=true
else
  USE_KEYLESS_AUTH=false
fi

echo "Creating App Service plan and Web App..."
# Note: managed identity RBAC assignment happens after webapp creation below.
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

# Enable system-assigned managed identity on App Service
echo "Enabling system-assigned managed identity on App Service..."
az webapp identity assign \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

if [[ "$USE_KEYLESS_AUTH" == "true" ]]; then
  echo "Granting App Service managed identity 'Cognitive Services OpenAI User' role on AOAI account..."
  WEBAPP_PRINCIPAL_ID="$(az webapp identity show \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId -o tsv)"
  AOAI_RESOURCE_ID="$(az cognitiveservices account show \
    --name "$AOAI_ACCOUNT_NAME" \
    --resource-group "$AOAI_RESOURCE_GROUP" \
    --query id -o tsv)"
  # Use --assignee-object-id to bypass Graph lookup delays
  az role assignment create \
    --assignee-object-id "$WEBAPP_PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "Cognitive Services OpenAI User" \
    --scope "$AOAI_RESOURCE_ID" \
    --output none 2>&1 || echo "Warning: AOAI role assignment failed. Assign 'Cognitive Services OpenAI User' manually to principal $WEBAPP_PRINCIPAL_ID on resource $AOAI_RESOURCE_ID."
fi

echo "Configuring backend app settings..."
if [[ "$USE_KEYLESS_AUTH" == "true" ]]; then
  az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
      SCM_DO_BUILD_DURING_DEPLOYMENT=true \
      AZURE_OPENAI_ENDPOINT="$AOAI_ENDPOINT" \
      AZURE_OPENAI_DEPLOYMENT="$AOAI_DEPLOYMENT" \
      AZURE_OPENAI_API_VERSION="$AOAI_API_VERSION" \
      AZURE_OPENAI_USE_KEYLESS=true \
    --output none
else
  az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
      SCM_DO_BUILD_DURING_DEPLOYMENT=true \
      AZURE_OPENAI_ENDPOINT="$AOAI_ENDPOINT" \
      AZURE_OPENAI_API_KEY="$AOAI_KEY" \
      AZURE_OPENAI_DEPLOYMENT="$AOAI_DEPLOYMENT" \
      AZURE_OPENAI_API_VERSION="$AOAI_API_VERSION" \
      AZURE_OPENAI_USE_KEYLESS=false \
    --output none
fi

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

# Grant current Cloud Shell user Storage Blob Data Contributor so login-auth works.
echo "Granting Storage Blob Data Contributor to current user on storage account..."
STORAGE_RESOURCE_ID="$(az storage account show \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)"
CURRENT_USER_OID="$(az ad signed-in-user show --query id -o tsv 2>/dev/null || true)"
if [[ -n "$CURRENT_USER_OID" ]]; then
  az role assignment create \
    --assignee-object-id "$CURRENT_USER_OID" \
    --assignee-principal-type User \
    --role "Storage Blob Data Contributor" \
    --scope "$STORAGE_RESOURCE_ID" \
    --output none 2>&1 | grep -v 'already exists' || true
  echo "Waiting 30s for RBAC to propagate..."
  sleep 30
else
  echo "Warning: Could not determine current user OID. Blob upload may fail if RBAC is not pre-assigned."
fi

echo "Configuring static website on storage account..."
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
echo "AOAI RG:      ${AOAI_RESOURCE_GROUP}"
echo "AOAI Account: ${AOAI_ACCOUNT_NAME}"
echo "AOAI Deploy:  ${AOAI_DEPLOYMENT}"
echo "\nBackend environment values in Azure App Service:"
echo "AZURE_OPENAI_ENDPOINT=${AOAI_ENDPOINT}"
echo "AZURE_OPENAI_DEPLOYMENT=${AOAI_DEPLOYMENT}"
echo "AZURE_OPENAI_API_VERSION=${AOAI_API_VERSION}"
echo "AZURE_OPENAI_API_KEY=<stored in App Service settings>"
echo "VITE_API_BASE_URL=${BACKEND_URL}"

echo "\nTo verify app settings from Azure:"
echo "az webapp config appsettings list -g ${RESOURCE_GROUP} -n ${WEBAPP_NAME} --query \"[].{name:name,value:value}\" -o table"
