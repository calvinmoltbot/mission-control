#!/bin/bash

# Log an activity to Mission Control
# Usage: ./log-activity.sh <type> <title> [description] [metadata-json]

API_URL="http://localhost:3000/api/activities"

TYPE=$1
TITLE=$2
DESCRIPTION=$3
METADATA=$4

if [ -z "$TYPE" ] || [ -z "$TITLE" ]; then
    echo "Usage: $0 <type> <title> [description] [metadata-json]"
    echo "Types: email, calendar, search, task, command, document, info"
    exit 1
fi

# Build JSON payload
JSON="{\"type\":\"$TYPE\",\"title\":\"$TITLE\""

if [ -n "$DESCRIPTION" ]; then
    JSON="$JSON,\"description\":\"$DESCRIPTION\""
fi

if [ -n "$METADATA" ]; then
    JSON="$JSON,\"metadata\":$METADATA"
fi

JSON="$JSON}"

# Send request
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON" 2>/dev/null

echo ""
