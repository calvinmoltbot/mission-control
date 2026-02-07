'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  Calendar, 
  Search, 
  LayoutDashboard,
  Settings,
  Bell,
  Mail
} from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import { CalendarView } from './CalendarView';
import { GlobalSearch } from './GlobalSearch';
import { GmailWidget } from './GmailWidget';
import { CalendarWidget } from './CalendarWidget';

type Tab = 'overview' | 'activity' | 'calendar' | 'search';

interface Stats {
  totalActivities: number;
  scheduledTasks: number;
  memoryEntries: number;
  unreadEmails: number;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats>({
    totalActivities: 0,
    scheduledTasks: 0,
    memoryEntries: 0,
    unreadEmails: 0,
  });

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      try {
        const [activitiesRes, cronRes, gmailRes] = await Promise.all([
          fetch('/api/activities'),
          fetch('/api/cron'),
          fetch('/api/gmail?q=is:unread&max=1'),
        ]);

        const activities = await activitiesRes.json();
        const cron = await cronRes.json();
        const gmail = await gmailRes.json();

        setStats({
          totalActivities: activities.activities?.length || 0,
          scheduledTasks: cron.tasks?.length || 0,
          memoryEntries: 0, // Would need to count memory files
          unreadEmails: gmail.emails?.length || 0,
        });
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity Feed', icon: <Activity className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center">
                <span className="text-lg">🃏</span>
              </div>
              <div>
                <h1 className="font-semibold text-zinc-100">Mission Control</h1>
                <p className="text-xs text-zinc-500">Jester Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-zinc-400" />
                {stats.unreadEmails > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 -mb-px">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === item.id
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Activities"
                value={stats.totalActivities.toString()}
                icon={<Activity className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                label="Scheduled Tasks"
                value={stats.scheduledTasks.toString()}
                icon={<Calendar className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                label="Unread Emails"
                value={stats.unreadEmails.toString()}
                icon={<Mail className="w-5 h-5" />}
                color="amber"
              />
              <StatCard
                label="Last Active"
                value="Just now"
                icon={<Bell className="w-5 h-5" />}
                color="purple"
              />
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gmail */}
              <GmailWidget />
              
              {/* Calendar */}
              <CalendarWidget />

              {/* Recent Activity */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100">Recent Activity</h3>
                      <p className="text-xs text-zinc-500">Latest actions</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className="text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    View all →
                  </button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  <ActivityFeed />
                </div>
              </div>
            </div>

            {/* Full Width Calendar */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-100">Scheduled Tasks & Events</h2>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className="text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Full calendar →
                </button>
              </div>
              <CalendarView />
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Activity Feed</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Complete history of all actions and tasks
              </p>
            </div>
            <ActivityFeed />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Calendar</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Scheduled tasks and upcoming events
              </p>
            </div>
            <CalendarView />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Global Search</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Search across memories, documents, and activities
              </p>
            </div>
            <GlobalSearch />
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}