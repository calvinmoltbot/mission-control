'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Inbox, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

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

interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
}

export function GmailWidget() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gmail?q=is:unread&max=10');
      const data = await res.json();
      setEmails(data.emails || []);
      setError(null);
    } catch (err) {
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/gmail', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, markAsRead: true }),
      });
      fetchEmails();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = emails.filter(e => e.isUnread).length;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold ring-2 ring-[oklch(0.12_0.008_280)]">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">Gmail</h3>
            <p className="text-xs text-zinc-500">calvinmoltbot@gmail.com</p>
          </div>
        </div>
        <button
          onClick={fetchEmails}
          disabled={loading}
          className="p-2 hover:bg-white/[0.06] rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && emails.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm py-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!loading && !error && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <Inbox className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm font-medium">All caught up</p>
          <p className="text-xs mt-0.5 text-zinc-700">No unread emails</p>
        </div>
      )}

      <div className="space-y-2">
        {emails.slice(0, 5).map((email) => (
          <div
            key={email.id}
            className={`p-3 rounded-xl border transition-all duration-200 group ${
              email.isUnread
                ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06]'
                : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {email.isUnread && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                  )}
                  <p className={`text-sm truncate ${email.isUnread ? 'font-medium text-zinc-200' : 'text-zinc-500'}`}>
                    {email.from}
                  </p>
                </div>
                <p className="text-sm text-zinc-300 mt-1 truncate">{email.subject}</p>
                <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{email.snippet}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-zinc-600 tabular-nums">
                  {safeFormatDistanceToNow(email.date)}
                </span>
                {email.isUnread && (
                  <button
                    onClick={() => markAsRead(email.id)}
                    className="p-1 hover:bg-white/[0.1] rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-zinc-600 hover:text-emerald-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {emails.length > 5 && (
          <p className="text-xs text-zinc-600 text-center pt-2">
            +{emails.length - 5} more emails
          </p>
        )}
      </div>
    </div>
  );
}
