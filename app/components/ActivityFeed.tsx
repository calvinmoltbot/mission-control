'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  Mail,
  Calendar,
  FileText,
  Search,
  Terminal
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
  'email': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'calendar': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'search': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'task': 'bg-green-500/10 text-green-500 border-green-500/20',
  'command': 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  'document': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  'info': 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  'heartbeat': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  'policy': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

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
    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Clock className="w-12 h-12 mb-4 opacity-50" />
        <p>No activities recorded yet</p>
        <p className="text-sm mt-1">Activities will appear here as tasks are completed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const type = activity.type || 'info';
        const icon = typeIcons[type] || typeIcons['info'];
        const colorClass = typeColors[type] || typeColors['info'];
        
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${colorClass}`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-zinc-100 truncate">{activity.title}</h4>
                <span className="text-xs text-zinc-500 flex-shrink-0">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
              {activity.description && (
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{activity.description}</p>
              )}
              {activity.metadata && (() => {
                try {
                  const parsed = JSON.parse(activity.metadata);
                  return (
                    <pre className="text-xs text-zinc-500 mt-2 bg-zinc-950 p-2 rounded overflow-x-auto">
                      {JSON.stringify(parsed, null, 2)}
                    </pre>
                  );
                } catch {
                  return (
                    <pre className="text-xs text-zinc-500 mt-2 bg-zinc-950 p-2 rounded overflow-x-auto">
                      {activity.metadata}
                    </pre>
                  );
                }
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}