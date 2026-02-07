#!/bin/bash

# Get Moonshot API balance
# Usage: ./moonshot-balance.sh

API_KEY="${MOONSHOT_API_KEY:-sk-N3Y1Cw1oSXktsOh7kBd4jcup88nMtiw54JMAbrpzJwnxKKR1}"
API_URL="https://api.moonshot.ai/v1/users/me/balance"

# Fetch balance
RESPONSE=$(curl -s -H "Authorization: Bearer ${API_KEY}" "$API_URL" 2>/dev/null)

# Check if successful
if echo "$RESPONSE" | grep -q '"status":true'; then
    AVAILABLE=$(echo "$RESPONSE" | grep -o '"available_balance":[0-9.]*' | cut -d':' -f2)
    CASH=$(echo "$RESPONSE" | grep -o '"cash_balance":[0-9.]*' | cut -d':' -f2)
    VOUCHER=$(echo "$RESPONSE" | grep -o '"voucher_balance":[0-9.]*' | cut -d':' -f2)
    
    echo "Balance: \$${AVAILABLE} (Cash: \$${CASH}, Voucher: \$${VOUCHER})"
    
    # Alert if low balance
    if (( $(echo "$AVAILABLE < 1.0" | bc -l) )); then
        echo "⚠️ LOW BALANCE - Please recharge"
        exit 1
    fi
    exit 0
else
    echo "Failed to fetch balance"
    exit 1
fi
