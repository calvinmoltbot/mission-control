'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, FileText, Activity, Calendar, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

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
  memory: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  activity: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  document: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  task: 'bg-green-500/10 text-green-500 border-green-500/20',
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories, activities, documents..."
          className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-700"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-500"></div>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && query.length >= 2 && (
        <div className="text-center py-8 text-zinc-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span>Sorted by relevance</span>
          </div>
          
          {results.map((result, idx) => {
            const icon = typeIcons[result.type];
            const colorClass = typeColors[result.type];
            
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${colorClass}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-zinc-100 truncate">{result.title}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex-shrink-0 px-2 py-0.5 bg-zinc-800 rounded-full">
                      {result.type}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1 line-clamp-3 whitespace-pre-wrap">
                    {result.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                    {result.path && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {result.path}
                      </span>
                    )}
                    {result.date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(result.date), 'MMM d, yyyy')}
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
            className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Recent Activities</span>
            </div>
            <p className="text-xs text-zinc-500">View all recorded actions</p>
          </button>
          
          <button
            onClick={() => setQuery('memory')}
            className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Memory Files</span>
            </div>
            <p className="text-xs text-zinc-500">Search saved memories</p>
          </button>
          
          <button
            onClick={() => setQuery('scheduled')}
            className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Scheduled Tasks</span>
            </div>
            <p className="text-xs text-zinc-500">Find upcoming events</p>
          </button>
          
          <button
            onClick={() => setQuery('Marillion')}
            className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">Topics</span>
            </div>
            <p className="text-xs text-zinc-500">Search for interests</p>
          </button>
        </div>
      )}
    </div>
  );
}