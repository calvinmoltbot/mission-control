'use client';

import { useEffect, useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  creator: string;
  isAllDay: boolean;
}

// Safe date parsing helper
function safeParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calendar?days=7');
      const data = await res.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err) {
      setError('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Poll every 5 minutes
    const interval = setInterval(fetchEvents, 300000);
    return () => clearInterval(interval);
  }, []);

  const getEventTimeLabel = (start: string) => {
    const date = safeParseDate(start);
    if (!date) return 'No date';
    try {
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'EEE, MMM d');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) return 'All day';
    const startDate = safeParseDate(start);
    const endDate = safeParseDate(end);
    if (!startDate || !endDate) return 'No time';
    try {
      return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    } catch (e) {
      return 'Invalid time';
    }
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">Calendar</h3>
            <p className="text-xs text-zinc-500">Next 7 days</p>
          </div>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && events.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-500"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm py-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
          <Calendar className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">No upcoming events</p>
        </div>
      )}

      <div className="space-y-3">
        {events.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex-shrink-0 w-14 text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                {getEventTimeLabel(event.start)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{event.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.start, event.end, event.isAllDay)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {events.length > 5 && (
          <p className="text-xs text-zinc-500 text-center pt-2">
            +{events.length - 5} more events
          </p>
        )}
      </div>
    </div>
  );
}