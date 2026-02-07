'use client';

import { useEffect, useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfDay,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface ScheduledTask {
  id: string;
  name: string;
  scheduleType: string;
  scheduleExpr: string;
  nextRunAt?: string;
  status: string;
  source: string;
}

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

function safeParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
}

function safeFormat(date: Date | null, formatStr: string): string {
  if (!date) return 'Invalid date';
  try {
    return format(date, formatStr);
  } catch (e) {
    return 'Invalid date';
  }
}

export function CalendarView() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cronRes, calRes] = await Promise.all([
        fetch('/api/cron'),
        fetch('/api/calendar?days=14'),
      ]);
      const cronData = await cronRes.json();
      const calData = await calRes.json();
      setTasks(cronData.tasks || []);
      setCalendarEvents(calData.events || []);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.nextRunAt) return false;
      const taskDate = safeParseDate(task.nextRunAt);
      if (!taskDate) return false;
      return isSameDay(startOfDay(taskDate), startOfDay(date));
    });
  };

  const getEventsForDay = (date: Date) => {
    return calendarEvents.filter(event => {
      if (!event.start) return false;
      const eventDate = safeParseDate(event.start);
      if (!eventDate) return false;
      return isSameDay(startOfDay(eventDate), startOfDay(date));
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">
            {safeFormat(weekStart, 'MMM d')} - {safeFormat(weekEnd, 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60"></span>
          Cron Tasks
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-violet-500/60"></span>
          Calendar Events
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-zinc-600 py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Days */}
        {weekDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] p-2.5 rounded-xl border transition-all duration-200 ${
                isCurrentDay
                  ? 'border-indigo-500/30 bg-gradient-to-b from-indigo-500/[0.08] to-transparent shadow-lg shadow-indigo-500/5'
                  : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className={`text-sm font-semibold mb-2 ${
                isCurrentDay ? 'text-indigo-400' : 'text-zinc-500'
              }`}>
                {safeFormat(day, 'd')}
                {isCurrentDay && <span className="text-[10px] ml-1 font-normal text-indigo-400/70">today</span>}
              </div>
              <div className="space-y-1">
                {/* Calendar events (purple) */}
                {dayEvents.slice(0, 2).map((event, idx) => {
                  const startDate = safeParseDate(event.start);
                  return (
                    <div
                      key={`evt-${event.id}-${idx}`}
                      className="text-xs p-1.5 rounded-md bg-violet-500/10 border border-violet-500/20 truncate"
                      title={event.title}
                    >
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"></span>
                        <span className="truncate text-violet-200">{event.title}</span>
                      </div>
                      {startDate && !event.isAllDay && (
                        <div className="text-violet-400/60 text-[10px] mt-0.5 ml-3">
                          {safeFormat(startDate, 'h:mm a')}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Cron tasks (green) */}
                {dayTasks.slice(0, 2).map((task, idx) => (
                  <div
                    key={`task-${task.id}-${idx}`}
                    className="text-xs p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 truncate"
                    title={task.name}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500/60" />
                      <span className="truncate text-emerald-200">{task.name}</span>
                    </div>
                    <div className="text-emerald-400/60 text-[10px] mt-0.5 ml-4">
                      {task.scheduleType === 'cron' ? 'Recurring' : 'Once'}
                    </div>
                  </div>
                ))}
                {(dayTasks.length + dayEvents.length) > 4 && (
                  <div className="text-[10px] text-zinc-600 text-center pt-0.5">
                    +{dayTasks.length + dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Tasks & Events List */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-zinc-500 mb-3">Upcoming</h4>
        <div className="space-y-2">
          {/* Calendar events */}
          {calendarEvents
            .filter(e => {
              const date = safeParseDate(e.start);
              return date && date >= new Date();
            })
            .slice(0, 3)
            .map(event => {
              const eventDate = safeParseDate(event.start);
              return (
                <div
                  key={`upcoming-evt-${event.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{event.title}</p>
                      <p className="text-xs text-zinc-600">{event.location || 'Calendar event'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 tabular-nums">
                    {eventDate ? safeFormat(eventDate, 'MMM d, HH:mm') : 'No date'}
                  </div>
                </div>
              );
            })}

          {/* Cron tasks */}
          {tasks
            .filter(t => {
              const date = safeParseDate(t.nextRunAt || '');
              return date && date >= new Date();
            })
            .slice(0, 5)
            .map(task => {
              const taskDate = safeParseDate(task.nextRunAt || '');
              return (
                <div
                  key={`upcoming-task-${task.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{task.name}</p>
                      <p className="text-xs text-zinc-600">{task.scheduleExpr}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 tabular-nums">
                    {taskDate ? safeFormat(taskDate, 'MMM d, HH:mm') : 'No date'}
                  </div>
                </div>
              );
            })}
          {tasks.filter(t => {
            const date = safeParseDate(t.nextRunAt || '');
            return date && date >= new Date();
          }).length === 0 && calendarEvents.filter(e => {
            const date = safeParseDate(e.start);
            return date && date >= new Date();
          }).length === 0 && (
            <p className="text-sm text-zinc-600 text-center py-4">No upcoming tasks or events</p>
          )}
        </div>
      </div>
    </div>
  );
}
