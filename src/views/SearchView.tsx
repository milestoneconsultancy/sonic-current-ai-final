import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Plus, Grid, List, Music2, Sparkles, X, Clock } from 'lucide-react';
import { Song } from '../types';
import { SongListItem } from '../components/SongListItem';
import { SongCard } from '../components/SongCard';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: Song[];
  isSearching: boolean;
  searchError: string | null;
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  activeContextQuery?: string;
  hasMoreResults?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onPlaySong: (song: Song, index?: number) => void;
  onPlayAll: (songs: Song[]) => void;
  onToggleFavorite: (song: Song) => void;
  onDownloadSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onAddAllToQueue: (songs: Song[]) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  searchError,
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  activeContextQuery,
  hasMoreResults = false,
  isLoadingMore = false,
  onLoadMore,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
  onAddAllToQueue,
}) => {
  const [typedQuery, setTypedQuery] = useState(searchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [liveSuggestions, setLiveSuggestions] = useState<Song[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync typed query with incoming searchQuery if changed externally
  useEffect(() => {
    setTypedQuery(searchQuery);
  }, [searchQuery]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!hasMoreResults || isLoadingMore || !onLoadMore || isSearching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMoreResults, isLoadingMore, onLoadMore, isSearching, searchResults.length]);

  // Focus input automatically when Search view mounts / opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Fetch live song suggestions on typing (debounced)
  useEffect(() => {
    const trimmed = typedQuery.trim();
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
            setShowSuggestions(true);
          } else {
            setLiveSuggestions([]);
          }
          setSelectedIndex(-1);
        })
        .catch((err) => {
          console.error('Failed to fetch song suggestions:', err);
          setLiveSuggestions([]);
          setSelectedIndex(-1);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [typedQuery]);

  // Handle outside click to hide suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (liveSuggestions.length > 0) {
        e.preventDefault();
        setShowSuggestions(true);
        setSelectedIndex((prev) => (prev + 1) % liveSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (liveSuggestions.length > 0) {
        e.preventDefault();
        setShowSuggestions(true);
        setSelectedIndex((prev) => (prev - 1 + liveSuggestions.length) % liveSuggestions.length);
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < liveSuggestions.length) {
        e.preventDefault();
        const selectedSong = liveSuggestions[selectedIndex];
        onPlaySong(selectedSong);
        setShowSuggestions(false);
      } else if (typedQuery.trim()) {
        e.preventDefault();
        setShowSuggestions(false);
        onSearchChange(typedQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = (song: Song) => {
    onPlaySong(song);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setTypedQuery('');
    onSearchChange('');
    setLiveSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const popularQueries = [
    'Kesariya',
    'Arijit Singh',
    'Ganpati DJ',
    'Marathi Hits',
    'Bollywood Top 20',
    'Pritam',
    'Shreya Ghoshal',
    'Badshah DJ',
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Immediate Focus Search Dialog Container */}
      <div ref={containerRef} className="relative z-30">
        <div className="bg-white/95 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/50">
          <div className="relative flex items-center w-full rounded-2xl bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 focus-within:bg-white transition-all duration-200">
            <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={typedQuery}
              onFocus={() => {
                if (liveSuggestions.length > 0) setShowSuggestions(true);
              }}
              onChange={(e) => {
                setTypedQuery(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search songs..."
              className="w-full bg-transparent px-3.5 py-3.5 text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {isSearching || isLoadingSuggestions ? (
              <div className="mr-4 w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
            ) : typedQuery ? (
              <button
                onClick={handleClear}
                className="mr-3 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
            <button
              onClick={() => {
                if (typedQuery.trim()) {
                  setShowSuggestions(false);
                  onSearchChange(typedQuery.trim());
                }
              }}
              className="mr-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
            >
              Search
            </button>
          </div>

          {/* Live Song Suggestions Overlay */}
          {showSuggestions && liveSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xl backdrop-blur-2xl z-50 space-y-1 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-700 uppercase tracking-wider px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Live Song Suggestions
              </div>

              {liveSuggestions.map((song, idx) => (
                <div
                  key={`${song.id}_${idx}`}
                  onClick={() => handleSelectSuggestion(song)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition group ${
                    selectedIndex === idx
                      ? 'bg-amber-100/90 text-amber-950 ring-1 ring-amber-400'
                      : 'hover:bg-amber-50/80 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop'}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop';
                      }}
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="font-bold text-sm text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                        {song.title}
                      </span>
                      <span className="text-xs font-medium text-slate-500 truncate">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 opacity-90 group-hover:opacity-100 group-hover:bg-amber-400 transition shrink-0 ml-2">
                    <Play className="w-3 h-3 fill-current" /> Play
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header Bar Controls for Results */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-600" />
            {searchQuery.trim() ? `Search Results for "${searchQuery.trim()}"` : 'Explore Music'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-xs text-slate-500 font-medium">
              {searchResults.length > 0 ? `${searchResults.length} songs found` : 'Search any song, artist, album or genre'}
            </p>
            {activeContextQuery && searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                {activeContextQuery}
              </span>
            )}
          </div>
        </div>

        {/* View Toggle & Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {searchResults.length > 0 && (
            <>
              <button
                onClick={() => onPlayAll(searchResults)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> Play All
              </button>
              <button
                onClick={() => onAddAllToQueue(searchResults)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Queue All
              </button>
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <span>{searchError}</span>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          <p className="text-xs font-mono font-bold text-slate-500">Searching high quality audio streams...</p>
        </div>
      )}

      {/* Results View */}
      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-6">
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {searchResults.map((song, idx) => (
                <SongListItem
                  key={`${song.id}_${idx}`}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrent={currentSong?.id === song.id}
                  isFavorite={favoritesSet.has(song.id)}
                  isDownloaded={downloadedSet.has(song.id)}
                  isDownloading={downloadingSet.has(song.id)}
                  onPlay={() => onPlaySong(song, idx)}
                  onToggleFavorite={onToggleFavorite}
                  onDownload={onDownloadSong}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((song, idx) => (
                <SongCard
                  key={`${song.id}_${idx}`}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrent={currentSong?.id === song.id}
                  isFavorite={favoritesSet.has(song.id)}
                  isDownloaded={downloadedSet.has(song.id)}
                  isDownloading={downloadingSet.has(song.id)}
                  onPlay={() => onPlaySong(song, idx)}
                  onToggleFavorite={onToggleFavorite}
                  onDownload={onDownloadSong}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Progressive Loading Indicator */}
          <div ref={sentinelRef} className="pt-6 pb-2 flex flex-col items-center justify-center text-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2.5 py-3 px-5 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                <span>Loading more songs…</span>
              </div>
            )}
            {!hasMoreResults && searchResults.length > 0 && !isLoadingMore && (
              <p className="text-xs font-semibold text-slate-400 py-2">
                You've reached the end of available results.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty / Welcome Search Prompt State */}
      {!isSearching && searchResults.length === 0 && (
        <div className="py-12 px-6 rounded-3xl bg-white border border-slate-200/90 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <Music2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">FREE MUSIC</h3>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-0.5">
              SURAJ KHANDAGALE
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium pt-1">
              Type any song name, artist, Marathi DJ track, or Bollywood hits above to listen immediately.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              Popular Searches
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {popularQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => {
                    setTypedQuery(query);
                    onSearchChange(query);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 text-xs font-bold text-slate-700 transition shadow-xs"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
