import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDb, ScheduledTask } from '@/lib/db';

const execAsync = promisify(exec);

interface CronJob {
  jobId: string;
  name?: string;
  schedule: {
    kind: string;
    expr?: string;
    everyMs?: number;
  };
  payload: {
    kind: string;
    text?: string;
    message?: string;
  };
  enabled: boolean;
  sessionTarget: string;
}

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from OpenClaw cron
    let cronJobs: CronJob[] = [];
    try {
      const { stdout } = await execAsync('openclaw cron list --json 2>/dev/null || echo "[]"');
      cronJobs = JSON.parse(stdout || '[]');
    } catch (e) {
      console.log('OpenClaw cron not available, using DB only');
    }

    // Get tasks from local DB
    const db = getDb();
    const localTasks = db.prepare('SELECT * FROM scheduled_tasks ORDER BY next_run_at ASC').all() as ScheduledTask[];

    // Merge and format for calendar
    const tasks = cronJobs.map((job: CronJob) => {
      let nextRun: Date | null = null;
      
      if (job.schedule.kind === 'cron' && job.schedule.expr) {
        // Simple cron parsing for display
        nextRun = estimateNextCronRun(job.schedule.expr);
      } else if (job.schedule.kind === 'every' && job.schedule.everyMs) {
        nextRun = new Date(Date.now() + job.schedule.everyMs);
      }

      return {
        id: job.jobId,
        name: job.name || job.payload.text || job.payload.message || 'Scheduled Task',
        scheduleType: job.schedule.kind,
        scheduleExpr: job.schedule.expr || `${job.schedule.everyMs}ms`,
        nextRunAt: nextRun?.toISOString(),
        status: job.enabled ? 'active' : 'disabled',
        source: 'openclaw'
      };
    });

    // Add local DB tasks
    const allTasks = [...tasks, ...localTasks.map(t => ({
      ...t,
      source: 'local'
    }))];

    return NextResponse.json({ tasks: allTasks });
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled tasks' },
      { status: 500 }
    );
  }
}

function estimateNextCronRun(cronExpr: string): Date {
  // Simple estimation - in production, use a proper cron parser
  const now = new Date();
  const [minute, hour, day, month, dayOfWeek] = cronExpr.split(' ');
  
  const next = new Date(now);
  next.setSeconds(0);
  
  if (minute !== '*') next.setMinutes(parseInt(minute));
  if (hour !== '*') next.setHours(parseInt(hour));
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}