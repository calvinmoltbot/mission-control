# Mission Control Dashboard

A NextJS dashboard for Jester featuring:
- **Activity Feed** - Records every action and task completed
- **Calendar View** - Weekly view of all scheduled tasks
- **Global Search** - Search across memories, documents, and activities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## Building for Production

```bash
npm run build
```

The static export will be in the `dist/` directory.

## Logging Activities

To log activities from the main agent, use the activity logger:

```typescript
import { logActivity, ActivityTypes } from '@/lib/activity-logger';

await logActivity({
  type: ActivityTypes.TASK,
  title: 'Completed email triage',
  description: 'Processed 5 forwarded emails',
  metadata: { count: 5, urgent: 1 }
});
```

## Architecture

- **Database**: SQLite (better-sqlite3) for local storage
- **API Routes**: 
  - `/api/activities` - CRUD for activities
  - `/api/cron` - Fetch scheduled tasks from OpenClaw
  - `/api/search` - Global search across all data
- **Components**:
  - `ActivityFeed` - Real-time activity stream
  - `CalendarView` - Weekly calendar with tasks
  - `GlobalSearch` - Search interface

## Data Storage

- SQLite database: `data/mission-control.db`
- Activities table: stores all logged actions
- Scheduled tasks table: caches cron job information
