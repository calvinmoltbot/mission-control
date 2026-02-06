import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

const execAsync = promisify(exec);

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  creator?: { email: string; displayName?: string };
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const now = new Date();
    const from = format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ssXXX");
    const to = format(endOfDay(addDays(now, days)), "yyyy-MM-dd'T'HH:mm:ssXXX");

    // Fetch calendar events using gog
    const cmd = `gog calendar events calvinmoltbot@gmail.com --from "${from}" --to "${to}" --account calvinmoltbot@gmail.com --json`;
    console.log('Executing:', cmd);
    
    let stdout: string;
    try {
      const result = await execAsync(cmd, {
        env: { ...process.env, GOG_ACCOUNT: 'calvinmoltbot@gmail.com' },
        timeout: 10000
      });
      stdout = result.stdout;
    } catch (execError: any) {
      console.error('gog command failed:', execError.stderr || execError.message);
      stdout = '[]';
    }

    let events: CalendarEvent[] = [];
    try {
      const parsed = JSON.parse(stdout || '[]');
      // gog returns { events: [...] } not just [...]
      if (Array.isArray(parsed)) {
        events = parsed;
      } else if (parsed && Array.isArray(parsed.events)) {
        events = parsed.events;
      } else {
        console.error('Unexpected gog output format:', stdout);
        events = [];
      }
    } catch (parseError) {
      console.error('Failed to parse gog output:', stdout);
      events = [];
    }

    // Format events for display
    const formattedEvents = events.map(event => {
      const startDate = event.start?.dateTime || event.start?.date;
      const endDate = event.end?.dateTime || event.end?.date;
      
      return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        start: startDate,
        end: endDate,
        location: event.location || '',
        creator: event.creator?.displayName || event.creator?.email || '',
        isAllDay: !event.start?.dateTime,
      };
    });

    // Sort by start date
    formattedEvents.sort((a, b) => {
      const aTime = a.start ? new Date(a.start).getTime() : 0;
      const bTime = b.start ? new Date(b.start).getTime() : 0;
      return aTime - bTime;
    });

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', events: [] },
      { status: 500 }
    );
  }
}