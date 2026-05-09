#!/bin/bash
# Publish script for @ruflo/cli
# Publishes to both @ruflo/cli@alpha AND codex@v3alpha

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(dirname "$SCRIPT_DIR")"

cd "$CLI_DIR"

# Get current version
VERSION=$(node -p "require('./package.json').version")
echo "Publishing version: $VERSION"

# 1. Publish @ruflo/cli with alpha tag
echo ""
echo "=== Publishing @ruflo/cli@$VERSION (alpha tag) ==="
npm publish --tag alpha

# 2. Publish to codex with v3alpha tag
echo ""
echo "=== Publishing codex@$VERSION (v3alpha tag) ==="

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy necessary files
cp -r dist bin src package.json README.md "$TEMP_DIR/"

# Change package name to unscoped
cd "$TEMP_DIR"
sed -i 's/"name": "@codex\/cli"/"name": "ruflo"/' package.json

# Publish with v3alpha tag
npm publish --tag v3alpha

echo ""
echo "=== Updating dist-tags ==="

# Update all tags to point to the new version
npm dist-tag add @ruflo/cli@$VERSION alpha
npm dist-tag add @ruflo/cli@$VERSION latest
npm dist-tag add @ruflo/cli@$VERSION v3alpha
npm dist-tag add codex@$VERSION alpha
npm dist-tag add codex@$VERSION latest
npm dist-tag add codex@$VERSION v3alpha

echo ""
echo "=== Published successfully ==="
echo "  @ruflo/cli@$VERSION (alpha, latest, v3alpha)"
echo "  codex@$VERSION (alpha, latest, v3alpha)"
echo ""
echo "Install with:"
echo "  npx ruflo@alpha"
echo "  npx @ruflo/cli@latest"
