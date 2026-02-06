# CLAUDE.md - Developer Guide for Mission Control

This file contains everything Claude Code needs to know to work effectively with the Mission Control dashboard.

---

## What Is This?

Mission Control is a personal dashboard for Jester (the AI assistant). It provides:
- **Activity Feed** — Records every action Jester completes
- **Calendar View** — Shows scheduled tasks and Google Calendar events
- **Global Search** — Searches across memory files and activity history
- **Gmail Widget** — Displays unread emails
- **Calendar Widget** — Shows upcoming events

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| Platform | Node.js (runs locally) |

---

## Project Structure

```
mission-control/my-app/
├── app/
│   ├── api/                    # API routes
│   │   ├── activities/         # GET/POST activity logs
│   │   ├── calendar/           # Google Calendar integration
│   │   ├── cron/               # OpenClaw scheduled tasks
│   │   ├── gmail/              # Gmail integration
│   │   └── search/             # Global search endpoint
│   ├── components/             # React components
│   │   ├── ActivityFeed.tsx    # Activity stream
│   │   ├── CalendarView.tsx    # Weekly calendar
│   │   ├── CalendarWidget.tsx  # Calendar sidebar widget
│   │   ├── Dashboard.tsx       # Main layout
│   │   ├── GlobalSearch.tsx    # Search interface
│   │   └── GmailWidget.tsx     # Gmail sidebar widget
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Homepage
├── lib/
│   ├── db.ts                   # Database setup
│   └── activity-logger.ts      # Logging utility
├── data/                       # SQLite database (gitignored)
├── .gitignore                  # Excludes node_modules, data/, .env
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- `npm` or `yarn`
- `gog` CLI installed and authenticated (for Gmail/Calendar features)

### Installation

```bash
cd mission-control/my-app
npm install
```

### Running Development Server

```bash
npm run dev
```
- URL: http://localhost:3010
- Hot reload enabled
- Uses development build

### Running Production Server

```bash
npm run build
npm start
```
- URL: http://localhost:3010
- Optimized production build
- Required for testing API routes properly

---

## Database

**Location:** `data/mission-control.db` (created automatically, gitignored)

**Tables:**
```sql
-- Activities table
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,        -- email, calendar, search, task, command, document, info, heartbeat
  title TEXT NOT NULL,
  description TEXT,
  metadata TEXT,             -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled tasks table
CREATE TABLE scheduled_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT,
  name TEXT,
  schedule_type TEXT,
  schedule_expr TEXT,
  next_run_at DATETIME,
  last_run_at DATETIME,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Note:** The `data/` directory is gitignored. The database is local-only.

---

## API Endpoints

### Activities
```bash
# List activities
GET /api/activities?limit=50&offset=0&type=email

# Create activity
POST /api/activities
Content-Type: application/json

{
  "type": "task",
  "title": "Task completed",
  "description": "Details here",
  "metadata": {"key": "value"}
}
```

### Calendar (Google)
```bash
# Get events for next N days
GET /api/calendar?days=7
```

### Gmail
```bash
# Get unread emails
GET /api/gmail?q=is:unread&max=10

# Mark as read
PATCH /api/gmail
{
  "messageId": "abc123",
  "markAsRead": true
}
```

### Search
```bash
# Search across memories and activities
GET /api/search?q=marillion
```

### Cron (OpenClaw)
```bash
# Get scheduled tasks
GET /api/cron
```

---

## External Integrations

### Google Workspace (via `gog` CLI)

The app uses `gog` (Google Workspace CLI) for Gmail and Calendar access:

```bash
# Required environment variable
export GOG_ACCOUNT=calvinmoltbot@gmail.com

# Commands used internally:
gog gmail messages search "is:unread" --max 20 --json
gog calendar events <calendarId> --from <iso> --to <iso> --json
```

**Note:** If `gog` is not authenticated, the Gmail and Calendar widgets will show errors but the rest of the app works fine.

---

## Logging Activities from Jester

### Method 1: Direct HTTP (Recommended)

```typescript
await fetch('http://localhost:3010/api/activities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'task',
    title: 'Task completed',
    description: 'Details here',
    metadata: { key: 'value' }
  }),
});
```

### Method 2: Using the Logger Utility

```typescript
import { logActivity, ActivityTypes } from './lib/activity-logger';

await logActivity({
  type: ActivityTypes.TASK,
  title: 'Task completed',
  description: 'Details here',
  metadata: { key: 'value' }
});
```

### Method 3: CLI Helper

```bash
./jester-log task "Task Title" "Description" '{"key":"value"}'
```

---

## Activity Types

| Type | Use For |
|------|---------|
| `email` | Email triage, processing |
| `calendar` | Calendar operations |
| `search` | Web searches, lookups |
| `task` | Completed tasks |
| `command` | Shell commands executed |
| `document` | File operations |
| `info` | General information |
| `heartbeat` | Periodic check-ins |

---

## Common Tasks

### Adding a New Component

1. Create file in `app/components/`
2. Export component
3. Import in `Dashboard.tsx` or relevant page

### Adding a New API Route

1. Create directory in `app/api/<route>/`
2. Create `route.ts` with exported functions (GET, POST, etc.)
3. Test with curl or browser

### Modifying the Database

Edit `lib/db.ts`:
- Add new tables in `initDb()`
- Add TypeScript interfaces
- The database auto-migrates on startup

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3010
lsof -i :3010

# Kill it
kill -9 <PID>
```

### Database Issues
```bash
# Delete and recreate database (WARNING: loses all data)
rm -rf data/
# Restart server, it will recreate the database
```

### Build Errors
```bash
# Clean build artifacts
rm -rf .next/
npm run build
```

### Gmail/Calendar Not Working
- Check `gog auth list` is authenticated
- Verify `GOG_ACCOUNT` environment variable
- Check console for error messages

---

## Security Notes

- **No sensitive data in GitHub:** Database, logs, and .env files are gitignored
- **Local only:** This app is designed to run locally, not deployed publicly
- **Read-only Gmail:** The app only reads emails, never sends
- **Google Workspace:** Uses OAuth via `gog`, credentials stored in system keychain

---

## Development Workflow

1. **Make changes** to components or API routes
2. **Test in dev mode:** `npm run dev`
3. **Build before committing:** `npm run build`
4. **Commit and push**
5. **Production server auto-restarts** (if using launchd service)

---

## File Locations

| File/Directory | Purpose |
|----------------|---------|
| `my-app/` | Main application code |
| `my-app/data/` | SQLite database (gitignored) |
| `jester-log` | CLI logging helper |
| `install-service.sh` | macOS service installer |
| `com.jester.mission-control.plist` | macOS LaunchAgent config |
| `~/Library/LaunchAgents/` | Where service file is installed |

---

## Questions?

If something isn't working:
1. Check the browser console for errors
2. Check `logs/mission-control-error.log`
3. Try `npm run build` to catch TypeScript errors
4. Verify the port isn't in use: `lsof -i :3010`

---

*Last updated: 6 February 2026*
