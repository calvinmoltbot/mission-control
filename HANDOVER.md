# Handover: Bug Fixes Applied & Remaining Items for OpenClaw

**Date:** 7 February 2026
**Author:** Claude Code (code review session with Calvin)

---

## What Was Fixed (This Commit)

These are straightforward bug fixes — no architectural changes.

### 1. Stats Calculation Bug — `app/components/Dashboard.tsx`
- **Was:** `totalActivities` used the first activity's database `id` as the count (`activities.activities[0]?.id`), which gives wrong numbers as IDs auto-increment and don't reflect actual count.
- **Now:** Uses `activities.activities?.length || 0` — the actual array length.
- Also removed the `?limit=1` on the activities fetch so the count reflects all returned activities.

### 2. Port Mismatch — `log-activity.sh` and `start.sh`
- **Was:** Both scripts defaulted to port `3000`, but `package.json` runs the app on `3010`.
- **Now:** Both default to `3010` to match.
- Also updated the usage help in `log-activity.sh` to list `heartbeat` and `policy` types.

### 3. Missing Activity Types — `lib/activity-logger.ts` and `app/components/ActivityFeed.tsx`
- **Was:** `ActivityTypes` only had 7 types. `HEARTBEAT` and `POLICY` were documented in CLAUDE.md but missing from code.
- **Now:** Added `HEARTBEAT` and `POLICY` to the `ActivityTypes` constant.
- Added corresponding icons (`Clock` for heartbeat, `FileText` for policy) and colours (`rose` for heartbeat, `orange` for policy) to `ActivityFeed.tsx`.

### 4. JSON Parse Crash — `app/components/ActivityFeed.tsx`
- **Was:** `JSON.parse(activity.metadata)` called without try/catch. If any activity has malformed metadata, the entire feed crashes.
- **Now:** Wrapped in try/catch. Valid JSON is pretty-printed as before; invalid JSON is shown as raw text.

### 5. Unused Dependencies — `package.json`
- **Removed:** `sqlite3` (redundant — `better-sqlite3` is used) and `recharts` (not used anywhere in the codebase).
- Run `npm install` after pulling to clean up `node_modules`.

---

## Remaining Items for OpenClaw

These require architectural decisions that OpenClaw should own, since they affect how the broader Jester system interacts with Mission Control.

### Security (Should Fix)

#### A. Shell Command Injection in `gog` CLI Calls
**Files:** `app/api/calendar/route.ts`, `app/api/gmail/route.ts`

User-provided query parameters are interpolated directly into shell command strings passed to `execAsync()`. For example in the Gmail route:
```typescript
const query = searchParams.get('q') || 'is:unread';
execAsync(`gog gmail messages search "${query}" ...`);
```
A query containing shell metacharacters (e.g. `"; rm -rf /; "`) could break or exploit the command.

**Recommendation:** Use `execFile()` or pass arguments as an array instead of string interpolation, or sanitise inputs before shell execution.

#### B. Hardcoded Email Address
**Files:** `app/api/calendar/route.ts`, `app/api/gmail/route.ts`

`calvinmoltbot@gmail.com` is hardcoded in multiple places. Should come from an environment variable (e.g. `GOG_ACCOUNT`) or OpenClaw configuration, as documented in CLAUDE.md's External Integrations section.

### Functionality (Should Fix)

#### C. Incomplete Cron Expression Parser
**File:** `app/api/cron/route.ts`

`estimateNextCronRun()` only handles minute and hour fields — day, month, and day-of-week are ignored. The code itself notes: "Simple estimation — in production, use a proper cron parser."

**Recommendation:** Use an npm package like `cron-parser` for accurate next-run calculations, or handle this server-side in OpenClaw and pass the computed `nextRunAt` timestamp directly.

### Architecture (Nice to Have)

#### D. Polling vs Real-time Updates
Components poll on 30-60 second intervals. Server-Sent Events (SSE) would be lighter and give instant updates when Jester logs activities. This would be especially useful for the activity feed during active sessions.

#### E. No Error Boundaries
A single component crash (e.g. from unexpected API data) takes down the entire dashboard. React error boundaries around each widget would keep the rest of the dashboard functional.

#### F. Search Memory Path Assumptions
**File:** `app/api/search/route.ts`

The search route assumes memory files are at `../../memory` relative to the app. This path assumption may break if the project structure changes.

---

## After Pulling This Commit

1. Run `npm install` to remove the dropped dependencies from `node_modules`
2. Verify the dashboard loads and stats show correct counts
3. Test logging a `heartbeat` or `policy` activity to confirm the new types render

---

*This file can be deleted once OpenClaw has processed the remaining items.*
