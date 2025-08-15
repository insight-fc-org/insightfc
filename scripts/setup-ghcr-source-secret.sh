

#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# setup-ghcr-source-secret.sh
# ----------------------------------------------------------------------------
# One-time initializer for the *source* docker-registry secret (ghcr-creds)
# in your cluster. The secret is created in a shared namespace (default: argocd)
# and will be COPIED into each preview namespace by the Helm/Argo PreSync hook.
#
# ⚠️  This script does NOT run in CI and should not be committed with secrets.
#     You must run it manually with kubectl context set to the target cluster.
#
# What it does
#   - Verifies kubectl access to your cluster
#   - Ensures the target namespace exists (default: argocd)
#   - Creates/updates a docker-registry Secret named ghcr-creds with GHCR creds
#   - Prints verification and next steps
#
# Requirements
#   - bash, kubectl
#   - A GitHub Personal Access Token (classic) with read:packages (and SSO if
#     your org requires SAML). Fine-grained PATs also work if granted org access
#     and approved by the org.
#
# Usage
#   export GHCR_USER="<your_github_username>"
#   export GHCR_PAT="<your_pat_with_read_packages>"
#   # optional overrides
#   export NAMESPACE="argocd"
#   export SECRET_NAME="ghcr-creds"
#   export DOCKER_SERVER="ghcr.io"
#
#   ./scripts/setup-ghcr-source-secret.sh            # interactive confirm
#   ./scripts/setup-ghcr-source-secret.sh -y         # non-interactive
# ----------------------------------------------------------------------------
set -euo pipefail

# --- Helpers -----------------------------------------------------------------
usage() {
  cat <<USAGE
Usage: \$0 [-y]

Options:
  -y    Non-interactive; skip confirmation prompts.

Environment variables:
  GHCR_USER          GitHub username (required)
  GHCR_PAT           GitHub PAT with read:packages (required)
  NAMESPACE          Namespace to hold the source secret (default: argocd)
  SECRET_NAME        Secret name (default: ghcr-creds)
  DOCKER_SERVER      Registry server (default: ghcr.io)
USAGE
}

confirm() {
  local prompt=\${1:-"Continue?"}
  if [[ "\${NON_INTERACTIVE:-0}" == "1" ]]; then
    return 0
  fi
  read -r -p "\${prompt} [y/N] " ans || true
  case "\${ans}" in
    y|Y|yes|YES) return 0 ;;
    *) echo "Aborted." ; exit 1 ;;
  esac
}

require_cmd() { command -v "\$1" >/dev/null 2>&1 || { echo "Error: '\$1' not found" >&2; exit 127; }; }

# --- Parse args --------------------------------------------------------------
NON_INTERACTIVE=0
while getopts ":hy" opt; do
  case \$opt in
    y) NON_INTERACTIVE=1 ;;
    h) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

# --- Preconditions -----------------------------------------------------------
require_cmd kubectl

NAMESPACE=\${NAMESPACE:-argocd}
SECRET_NAME=\${SECRET_NAME:-ghcr-creds}
DOCKER_SERVER=\${DOCKER_SERVER:-ghcr.io}

GHCR_USER=\${GHCR_USER:-}
GHCR_PAT=\${GHCR_PAT:-}

if [[ -z "\${GHCR_USER}" ]]; then
  read -r -p "GitHub username for GHCR: " GHCR_USER
fi
if [[ -z "\${GHCR_PAT}" ]]; then
  read -r -s -p "GitHub PAT (classic, read:packages): " GHCR_PAT
  echo ""
fi

# Show current context/cluster
CURRENT_CTX=\$(kubectl config current-context 2>/dev/null || true)
API_SERVER=\$(kubectl config view -o jsonpath='{.clusters[?(@.name=="'"\$CURRENT_CTX"'")].cluster.server}' 2>/dev/null || true)

echo "KUBECONFIG context: \${CURRENT_CTX:-<unknown>}"
echo "API server:       \${API_SERVER:-<unknown>}"

# Quick connectivity check
if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "Error: cannot reach the Kubernetes API. Ensure your KUBECONFIG points to the correct cluster." >&2
  exit 1
fi

# Confirm action
cat <<CONF
This will create/update a docker-registry Secret:
  Namespace : \${NAMESPACE}
  Name      : \${SECRET_NAME}
  Registry  : \${DOCKER_SERVER}
  GHCR User : \${GHCR_USER}

The PAT will NOT be stored in git. It will live only in the cluster Secret.
CONF
confirm "Proceed to create/update the secret?"

# Ensure namespace exists (idempotent)
if ! kubectl get ns "\${NAMESPACE}" >/dev/null 2>&1; then
  echo "Creating namespace '\${NAMESPACE}'..."
  kubectl create ns "\${NAMESPACE}"
fi

echo "Applying docker-registry secret '\${SECRET_NAME}' in namespace '\${NAMESPACE}'..."
# Use apply via dry-run to be idempotent
kubectl -n "\${NAMESPACE}" create secret docker-registry "\${SECRET_NAME}" \
  --docker-server="\${DOCKER_SERVER}" \
  --docker-username="\${GHCR_USER}" \
  --docker-password="\${GHCR_PAT}" \
  --docker-email="none@none" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Verifying secret contents..."
if [[ -z \$(kubectl -n "\${NAMESPACE}" get secret "\${SECRET_NAME}" -o jsonpath='{.data.\.dockerconfigjson}') ]]; then
  echo "Error: Secret exists but .dockerconfigjson is empty." >&2
  exit 1
fi

echo "✅ Secret '\${SECRET_NAME}' is present in namespace '\${NAMESPACE}'."

cat <<NEXT

Next steps:
  1) Ensure your Helm chart/ApplicationSet is configured to:
     - Run the PreSync copy job (privateRegistry.enabled=true)
     - Inject imagePullSecrets: [{ name: \${SECRET_NAME} }]
  2) Open a PR; the PreSync hook will copy this secret into 'pr-<n>' namespace.
  3) If image pulls fail with 403:
     - Confirm PAT has 'read:packages' and (if required) is org-approved/SSO-enabled
     - Confirm your GitHub user has read access to the package or to the repo

Security tips:
  - Rotate the PAT by re-running this script.
  - Limit who can read Secrets in the source namespace (RBAC).

Done.
NEXT