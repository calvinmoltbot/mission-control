'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

function safeFormatDistanceToNow(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

import {
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Mail,
  Calendar,
  FileText,
  Search,
  Terminal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  title: string;
  description?: string;
  metadata?: string;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  'email': <Mail className="w-4 h-4" />,
  'calendar': <Calendar className="w-4 h-4" />,
  'search': <Search className="w-4 h-4" />,
  'task': <CheckCircle className="w-4 h-4" />,
  'command': <Terminal className="w-4 h-4" />,
  'document': <FileText className="w-4 h-4" />,
  'info': <Info className="w-4 h-4" />,
  'heartbeat': <Clock className="w-4 h-4" />,
  'policy': <FileText className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  'email': 'text-blue-400',
  'calendar': 'text-purple-400',
  'search': 'text-amber-400',
  'task': 'text-emerald-400',
  'command': 'text-zinc-400',
  'document': 'text-cyan-400',
  'info': 'text-sky-400',
  'heartbeat': 'text-rose-400',
  'policy': 'text-orange-400',
};

function MetadataToggle({ metadata }: { metadata: string }) {
  const [expanded, setExpanded] = useState(false);

  let display: string;
  try {
    const parsed = JSON.parse(metadata);
    display = JSON.stringify(parsed, null, 2);
  } catch {
    display = metadata;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span>{expanded ? 'Hide' : 'Show'} details</span>
      </button>
      {expanded && (
        <pre className="text-xs text-zinc-500 mt-2 bg-black/30 p-3 rounded-lg overflow-x-auto border border-white/[0.04] animate-fade-in">
          {display}
        </pre>
      )}
    </div>
  );
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities?limit=50');
      const data = await res.json();
      setActivities(data.activities || []);
      setError(null);
    } catch (err) {
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Clock className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-medium">No activities recorded yet</p>
        <p className="text-sm mt-1 text-zinc-600">Activities will appear here as tasks are completed</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {activities.map((activity) => {
        const type = activity.type || 'info';
        const icon = typeIcons[type] || typeIcons['info'];
        const colorClass = typeColors[type] || typeColors['info'];
        const borderClass = `activity-border-${type}`;

        return (
          <div
            key={activity.id}
            className={`${borderClass} p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-0.5 ${colorClass}`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-zinc-200 truncate">{activity.title}</h4>
                  <span className="text-[11px] text-zinc-600 flex-shrink-0 tabular-nums">
                    {safeFormatDistanceToNow(activity.created_at)}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{activity.description}</p>
                )}
                {activity.metadata && (
                  <MetadataToggle metadata={activity.metadata} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
