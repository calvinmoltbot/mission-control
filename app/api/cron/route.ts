import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getDb, ScheduledTask } from '@/lib/db';
import * as cronParser from 'cron-parser';

const execFileAsync = promisify(execFile);

interface CronJob {
  jobId: string;
  name?: string;
  schedule: {
    kind: string;
    expr?: string;
    everyMs?: number;
    tz?: string;
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
      const { stdout } = await execFileAsync('openclaw', ['cron', 'list', '--json']);
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
        // Use proper cron parser with timezone support
        nextRun = estimateNextCronRun(job.schedule.expr, job.schedule.tz);
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

function estimateNextCronRun(cronExpr: string, timezone?: string): Date | null {
  try {
    // Use cron-parser for accurate next-run calculations
    const interval = cronParser.parseExpression(cronExpr, {
      tz: timezone || 'Europe/London'
    });
    return interval.next().toDate();
  } catch (e) {
    console.error('Failed to parse cron expression:', cronExpr, e);
    return null;
  }
}