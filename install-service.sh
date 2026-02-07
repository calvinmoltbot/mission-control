#!/bin/bash

# Install Mission Control as a macOS launchd service
# Requires GOG_KEYRING_PASSWORD to be set (or in .env file)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.jester.mission-control"
PLIST_DEST="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
LOG_DIR="${SCRIPT_DIR}/logs"

# Load GOG_KEYRING_PASSWORD from .env if not already set
if [ -z "$GOG_KEYRING_PASSWORD" ] && [ -f "${SCRIPT_DIR}/.env" ]; then
    GOG_KEYRING_PASSWORD=$(grep '^GOG_KEYRING_PASSWORD=' "${SCRIPT_DIR}/.env" | cut -d'=' -f2-)
fi

if [ -z "$GOG_KEYRING_PASSWORD" ]; then
    echo "Error: GOG_KEYRING_PASSWORD is required for gog CLI to work under launchd."
    echo ""
    echo "Either:"
    echo "  1. Export it:  GOG_KEYRING_PASSWORD='...' ./install-service.sh"
    echo "  2. Create .env file with: GOG_KEYRING_PASSWORD=your-password-here"
    exit 1
fi

# Create logs directory
mkdir -p "$LOG_DIR"

# Unload existing service if running
launchctl bootout "gui/$(id -u)/${PLIST_NAME}" 2>/dev/null || true

# Generate plist with secrets injected
cat > "$PLIST_DEST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npm</string>
        <string>run</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/mission-control.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/mission-control-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>${HOME}</string>
        <key>GOG_ACCOUNT</key>
        <string>calvinmoltbot@gmail.com</string>
        <key>GOG_KEYRING_PASSWORD</key>
        <string>${GOG_KEYRING_PASSWORD}</string>
    </dict>
</dict>
</plist>
EOF

echo "Installed plist to ${PLIST_DEST}"

# Load the service
launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST"
echo "Service loaded and starting."

echo ""
echo "Mission Control will now:"
echo "  - Start automatically on login"
echo "  - Restart if it crashes"
echo "  - Run on http://localhost:3010"
echo ""
echo "Useful commands:"
echo "  Status:    launchctl list | grep jester"
echo "  Stop:      launchctl bootout gui/$(id -u)/${PLIST_NAME}"
echo "  Logs:      tail -f ${LOG_DIR}/mission-control.log"
