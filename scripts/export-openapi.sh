#!/bin/bash

# Script to export the OpenAPI/Swagger specification
# This script waits for the app to start, fetches the OpenAPI JSON, and saves it

echo "🔄 Starting Mini CRM API..."

# Check if app is already running on port 3000
if ! nc -z localhost 3000 2>/dev/null; then
  echo "⏳ App not running. Please start it with: npm run start:dev"
  exit 1
fi

echo "📥 Fetching OpenAPI specification..."

# Fetch and save the OpenAPI JSON
curl -s http://localhost:3000/docs-json -o openapi.json

if [ -f openapi.json ] && [ -s openapi.json ]; then
  echo "✅ OpenAPI spec exported to: openapi.json"
  echo "📊 You can import this into Postman, Insomnia, or Apidog"
else
  echo "❌ Failed to fetch OpenAPI spec"
  exit 1
fi

# Optional: Convert to YAML using yq if available
if command -v yq &> /dev/null; then
  yq -P openapi.json > openapi.yaml
  echo "✅ Also exported as: openapi.yaml"
fi
