'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, FileText, Activity, Calendar, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

function safeFormatDate(dateStr: string, formatStr: string): string {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return format(date, formatStr);
  } catch {
    return 'Unknown';
  }
}

interface SearchResult {
  type: 'memory' | 'activity' | 'document' | 'task';
  title: string;
  content: string;
  path?: string;
  date?: string;
  relevance: number;
}

const typeIcons = {
  memory: <FileText className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  task: <Calendar className="w-4 h-4" />,
};

const typeColors = {
  memory: 'text-violet-400',
  activity: 'text-blue-400',
  document: 'text-amber-400',
  task: 'text-emerald-400',
};

const typeBadgeColors = {
  memory: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  activity: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  document: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  task: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, performSearch]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories, activities, documents..."
          className="w-full pl-12 pr-10 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all duration-200"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && query.length >= 2 && (
        <div className="text-center py-8 text-zinc-600">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No results found for &quot;{query}&quot;</p>
          <p className="text-sm mt-1 text-zinc-700">Try different keywords or check your spelling</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span>Sorted by relevance</span>
          </div>

          {results.map((result, idx) => {
            const icon = typeIcons[result.type];
            const colorClass = typeColors[result.type];
            const badgeClass = typeBadgeColors[result.type];

            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200 cursor-pointer group"
              >
                <div className={`flex-shrink-0 mt-0.5 ${colorClass}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{result.title}</h4>
                    <span className={`text-[10px] uppercase tracking-wider flex-shrink-0 px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      {result.type}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-3 whitespace-pre-wrap">
                    {result.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                    {result.path && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {result.path}
                      </span>
                    )}
                    {result.date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {safeFormatDate(result.date, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick filters */}
      {!hasSearched && (
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => setQuery('email')}
            className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-gradient-to-br hover:from-blue-500/[0.08] hover:to-transparent hover:border-blue-500/20 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium group-hover:text-blue-300 transition-colors">Recent Activities</span>
            </div>
            <p className="text-xs text-zinc-600">View all recorded actions</p>
          </button>

          <button
            onClick={() => setQuery('memory')}
            className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-gradient-to-br hover:from-violet-500/[0.08] hover:to-transparent hover:border-violet-500/20 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium group-hover:text-violet-300 transition-colors">Memory Files</span>
            </div>
            <p className="text-xs text-zinc-600">Search saved memories</p>
          </button>

          <button
            onClick={() => setQuery('scheduled')}
            className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-gradient-to-br hover:from-emerald-500/[0.08] hover:to-transparent hover:border-emerald-500/20 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Scheduled Tasks</span>
            </div>
            <p className="text-xs text-zinc-600">Find upcoming events</p>
          </button>

          <button
            onClick={() => setQuery('Marillion')}
            className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-gradient-to-br hover:from-amber-500/[0.08] hover:to-transparent hover:border-amber-500/20 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium group-hover:text-amber-300 transition-colors">Topics</span>
            </div>
            <p className="text-xs text-zinc-600">Search for interests</p>
          </button>
        </div>
      )}
    </div>
  );
}
