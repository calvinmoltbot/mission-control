'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Inbox, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

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
      // Refresh list
      fetchEmails();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Poll every 60 seconds
    const interval = setInterval(fetchEmails, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = emails.filter(e => e.isUnread).length;

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mail className="w-5 h-5 text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">Gmail</h3>
            <p className="text-xs text-zinc-500">calvinmoltbot@gmail.com</p>
          </div>
        </div>
        <button
          onClick={fetchEmails}
          disabled={loading}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && emails.length === 0 && (
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

      {!loading && !error && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
          <Inbox className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">No unread emails</p>
        </div>
      )}

      <div className="space-y-2">
        {emails.slice(0, 5).map((email) => (
          <div
            key={email.id}
            className={`p-3 rounded-lg border transition-colors ${
              email.isUnread 
                ? 'bg-zinc-800/50 border-zinc-700' 
                : 'bg-zinc-900/30 border-zinc-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {email.isUnread && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                  )}
                  <p className={`text-sm truncate ${email.isUnread ? 'font-medium text-zinc-200' : 'text-zinc-400'}`}>
                    {email.from}
                  </p>
                </div>
                <p className="text-sm text-zinc-300 mt-1 truncate">{email.subject}</p>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{email.snippet}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-zinc-600">
                  {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
                </span>
                {email.isUnread && (
                  <button
                    onClick={() => markAsRead(email.id)}
                    className="p-1 hover:bg-zinc-700 rounded"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-3 h-3 text-zinc-500 hover:text-green-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {emails.length > 5 && (
          <p className="text-xs text-zinc-500 text-center pt-2">
            +{emails.length - 5} more emails
          </p>
        )}
      </div>
    </div>
  );
}