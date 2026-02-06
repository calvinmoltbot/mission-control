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

// Safe date parsing helper
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

// Safe format helper
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
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-zinc-100">
            {safeFormat(weekStart, 'MMM d')} - {safeFormat(weekEnd, 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 text-sm hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-zinc-500 py-2">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {weekDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-2 rounded-lg border ${
                isCurrentDay 
                  ? 'border-zinc-600 bg-zinc-800/50' 
                  : 'border-zinc-800 bg-zinc-900/30'
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isCurrentDay ? 'text-zinc-100' : 'text-zinc-400'
              }`}>
                {safeFormat(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task, idx) => (
                  <div
                    key={`${task.id}-${idx}`}
                    className="text-xs p-1.5 rounded bg-zinc-800 border border-zinc-700 truncate"
                    title={task.name}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="truncate">{task.name}</span>
                    </div>
                    <div className="text-zinc-500 text-[10px] mt-0.5">
                      {task.scheduleType === 'cron' ? 'Recurring' : 'Once'}
                    </div>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-zinc-500 text-center">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Tasks List */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Upcoming Tasks</h4>
        <div className="space-y-2">
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
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'active' ? 'bg-green-500' : 'bg-zinc-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{task.name}</p>
                      <p className="text-xs text-zinc-500">{task.scheduleExpr}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {taskDate ? safeFormat(taskDate, 'MMM d, HH:mm') : 'No date'}
                  </div>
                </div>
              );
            })}
          {tasks.filter(t => {
            const date = safeParseDate(t.nextRunAt || '');
            return date && date >= new Date();
          }).length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">No upcoming tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}