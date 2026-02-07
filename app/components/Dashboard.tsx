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
import { MoonshotWidget } from './MoonshotWidget';

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
          memoryEntries: 0,
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
    <div className="min-h-screen bg-[oklch(0.10_0.008_280)] text-zinc-100">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[oklch(0.13_0.01_280)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <span className="text-lg">🃏</span>
              </div>
              <div>
                <h1 className="font-semibold text-white tracking-tight">Mission Control</h1>
                <p className="text-[11px] text-zinc-500 tracking-wide">Jester Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200 relative group">
                <Bell className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                {stats.unreadEmails > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[oklch(0.13_0.01_280)]"></span>
                )}
              </button>
              <button className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200 group">
                <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/[0.06] bg-[oklch(0.12_0.008_280)]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 -mb-px">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === item.id
                    ? 'tab-active border-indigo-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/50'
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
          <div className="space-y-6 animate-fade-in">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
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
              <GmailWidget />
              <CalendarWidget />
              <MoonshotWidget />
            </div>

            {/* Recent Activity — Full Width */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Recent Activity</h3>
                    <p className="text-xs text-zinc-500">Latest actions</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-sm text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  View all &rarr;
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <ActivityFeed />
              </div>
            </div>

            {/* Full Width Calendar */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Scheduled Tasks & Events</h2>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-sm text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  Full calendar &rarr;
                </button>
              </div>
              <CalendarView />
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Complete history of all actions and tasks
              </p>
            </div>
            <ActivityFeed />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Calendar</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Scheduled tasks and upcoming events
              </p>
            </div>
            <CalendarView />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Global Search</h2>
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
  const gradients = {
    blue: 'from-blue-500/10 to-blue-600/5',
    green: 'from-emerald-500/10 to-emerald-600/5',
    purple: 'from-violet-500/10 to-violet-600/5',
    amber: 'from-amber-500/10 to-amber-600/5',
  };

  const iconColors = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    purple: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };

  return (
    <div className={`stat-card glass-card bg-gradient-to-br ${gradients[color]} p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
