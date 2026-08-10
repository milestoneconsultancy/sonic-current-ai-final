import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Sparkles, Music } from 'lucide-react';
import { SearchHistoryItem, TabType } from '../types';

interface HeaderBarProps {
  currentTab: TabType;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchHistory: SearchHistoryItem[];
  onSelectHistoryQuery: (query: string) => void;
  onClearHistoryItem: (id: string) => void;
  isSearching: boolean;
  onTabChange: (tab: TabType) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
  searchHistory,
  onSelectHistoryQuery,
  onClearHistoryItem,
  isSearching,
  onTabChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live song suggestions debounced fetch
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || !navigator.onLine) {
      setLiveSuggestions([]);
      setSelectedIndex(-1);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    const timer = setTimeout(() => {
      fetch(`/api/suggestions?query=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setLiveSuggestions(data);
          } else {
            setLiveSuggestions([]);
          }
          setSelectedIndex(-1);
        })
        .catch((err) => {
          console.error('Failed to fetch suggestions:', err);
          setLiveSuggestions([]);
          setSelectedIndex(-1);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (liveSuggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % liveSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (liveSuggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + liveSuggestions.length) % liveSuggestions.length);
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < liveSuggestions.length) {
        e.preventDefault();
        onSelectHistoryQuery(liveSuggestions[selectedIndex]);
        setIsFocused(false);
      } else if (searchQuery.trim()) {
        onSelectHistoryQuery(searchQuery.trim());
        setIsFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const popularSuggestions = [
    'Ganpati Bappa',
    'Kesariya',
    'Arijit Singh',
    'Marathi Hits',
    'Bollywood Beats',
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
      {/* Title / Mobile Brand Banner */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Music className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base text-slate-900 tracking-tight leading-none">SONIC CURRENT</span>
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">MADE BY ONE CLICK SOLUTION</span>
          </div>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            {currentTab === 'home' && 'Discover Music'}
            {currentTab === 'search' && 'Search Library'}
            {currentTab === 'history' && 'Search & Playback History'}
            {currentTab === 'favorites' && 'Your Liked Tracks'}
            {currentTab === 'downloads' && 'Offline Library'}
          </h2>
        </div>
      </div>

      {/* Search Input Box (Mainly for Home and Search tabs) */}
      {(currentTab === 'home' || currentTab === 'search') && (
        <div ref={containerRef} className="relative flex-1 max-w-xl">
          <div
            className={`relative flex items-center w-full rounded-2xl bg-slate-100/90 border transition-all duration-200 ${
              isFocused
                ? 'border-amber-500 ring-2 ring-amber-400/20 bg-white shadow-md'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                setIsFocused(true);
                if (currentTab !== 'search') {
                  onTabChange('search');
                }
              }}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentTab !== 'search') {
                  onTabChange('search');
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search songs, artists, albums..."
              className="w-full bg-transparent px-3 py-2.5 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {isSearching || isLoadingSuggestions ? (
              <div className="mr-3.5 w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
            ) : searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="mr-3 p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Live Search Suggestions Dropdown */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xl backdrop-blur-2xl z-50 space-y-3 animate-in fade-in duration-150">
              {/* Live Autocomplete Song Title Suggestions */}
              {liveSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Song Suggestions
                  </div>
                  <div className="space-y-0.5">
                    {liveSuggestions.map((title, idx) => (
                      <div
                        key={title}
                        onClick={() => {
                          onSelectHistoryQuery(title);
                          setIsFocused(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group text-sm font-bold transition ${
                          selectedIndex === idx
                            ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-400'
                            : 'hover:bg-amber-50/80 hover:text-amber-900 text-slate-800'
                        }`}
                      >
                        <Search className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches (when query is short) */}
              {liveSuggestions.length === 0 && searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-2">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Recent Searches
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {searchHistory.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer group text-sm font-bold text-slate-800 transition"
                        onClick={() => {
                          onSelectHistoryQuery(item.query);
                          setIsFocused(false);
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.query}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearHistoryItem(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Trending Topics (when query is short) */}
              {liveSuggestions.length === 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Popular Searches
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {popularSuggestions.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          onSelectHistoryQuery(term);
                          setIsFocused(false);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200/80 text-slate-700 transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

