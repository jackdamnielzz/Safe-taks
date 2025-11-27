#!/usr/bin/env bash
# Creates a test LMRA via the local dev API
# Usage: bash web/scripts/create-test-lmra.sh
LMRA_ID="test-lmra-id"
API_URL="http://localhost:3000/api/lmras"

cat <<JSON > /tmp/create-lmra-payload.json
{
  "id": "'"$LMRA_ID"'",
  "title": "Test LMRA for E2E",
  "description": "Automatically created test LMRA for stop-work E2E tests",
  "createdBy": "test-runner",
  "site": "test-site"
}
JSON

echo "Posting LMRA to $API_URL"
curl -v -X POST "$API_URL" -H "Content-Type: application/json" -d @/tmp/create-lmra-payload.json || { echo "curl failed"; exit 1; }
