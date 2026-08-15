import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Plus, Grid, List, Music2, Sparkles, X, Clock, Mic, MicOff } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please type your search.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Works well for Indian accents, Hindi, Marathi, Hinglish
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Voice search error:', e);
        setIsListening(false);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setTypedQuery(transcript);
          try {
            const res = await fetch('/api/voice-command', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript }),
            });
            const parsed = await res.json();
            if (parsed && parsed.type === 'search' && parsed.query) {
              onSearchChange(parsed.query);
            } else {
              onSearchChange(transcript);
            }
          } catch {
            onSearchChange(transcript);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setIsListening(false);
    }
  };

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
        <div className="bg-[#FFFFFF] dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-[20px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs">
          <div className="relative flex items-center w-full rounded-[14px] bg-[#E5E5EA]/50 dark:bg-[#2C2C2E]/60 border border-transparent focus-within:border-[#FA2D48] focus-within:bg-[#FFFFFF] dark:focus-within:bg-[#1C1C1E] transition-all duration-200">
            <Search className="w-4 h-4 text-[#8E8E93] ml-3.5 shrink-0" />
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
              placeholder="Artists, Songs, Lyrics, and More"
              className="w-full bg-transparent px-3 py-3 text-sm font-medium text-black dark:text-white placeholder-[#8E8E93] focus:outline-none"
            />
            {isSearching || isLoadingSuggestions ? (
              <div className="mr-3.5 w-4 h-4 rounded-full border-2 border-[#FA2D48] border-t-transparent animate-spin shrink-0" />
            ) : typedQuery ? (
              <button
                onClick={handleClear}
                className="mr-2 p-1.5 text-[#8E8E93] hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}

            {/* Voice Search Button */}
            <button
              onClick={handleVoiceSearch}
              className={`mr-2 p-2 rounded-[10px] transition cursor-pointer flex items-center justify-center ${
                isListening
                  ? 'bg-[#FA2D48] text-white animate-bounce'
                  : 'text-[#8E8E93] hover:text-[#FA2D48] hover:bg-[#FA2D48]/10'
              }`}
              title={isListening ? 'Listening...' : 'Voice Search'}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (typedQuery.trim()) {
                  setShowSuggestions(false);
                  onSearchChange(typedQuery.trim());
                }
              }}
              className="mr-2 px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Live Song Suggestions Overlay */}
          {showSuggestions && liveSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2.5 rounded-[18px] bg-[#FFFFFF]/95 dark:bg-[#1C1C1E]/95 border border-[#C6C6C8]/50 dark:border-[#38383A]/70 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-2xl z-50 space-y-1 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FA2D48]" /> Suggestions
              </div>

              {liveSuggestions.map((song, idx) => (
                <div
                  key={`${song.id}_${idx}`}
                  onClick={() => handleSelectSuggestion(song)}
                  className={`flex items-center justify-between p-2.5 rounded-[12px] cursor-pointer transition group ${
                    selectedIndex === idx
                      ? 'bg-[#FA2D48]/10 text-[#FA2D48]'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop'}
                      alt={song.title}
                      className="w-10 h-10 rounded-[8px] object-cover border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop';
                      }}
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="font-semibold text-xs text-black dark:text-white truncate group-hover:text-[#FA2D48] transition-colors">
                        {song.title}
                      </span>
                      <span className="text-[11px] font-normal text-[#8E8E93] truncate">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  <button className="px-3 py-1 rounded-full bg-[#FA2D48] text-white font-semibold text-xs flex items-center gap-1 shrink-0 ml-2 cursor-pointer">
                    <Play className="w-2.5 h-2.5 fill-current" /> Play
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header Bar Controls for Results */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
            <Search className="w-5 h-5 text-[#FA2D48]" />
            {searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : 'Explore Music'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">
              {searchResults.length > 0 ? `${searchResults.length} songs` : 'Search songs, artists, albums, or genres'}
            </p>
            {activeContextQuery && searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-[#FA2D48] shrink-0" />
                {activeContextQuery}
              </span>
            )}
          </div>
        </div>

        {/* View Toggle & Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {searchResults.length > 0 && (
            <>
              <button
                onClick={() => onPlayAll(searchResults)}
                className="px-4 py-2 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play All
              </button>
              <button
                onClick={() => onAddAllToQueue(searchResults)}
                className="px-3.5 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Queue All
              </button>
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-[10px] bg-[#E5E5EA]/70 dark:bg-[#2C2C2E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-[#8E8E93]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-[8px] transition cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs' : 'hover:text-black dark:hover:text-white'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[8px] transition cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs' : 'hover:text-black dark:hover:text-white'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {searchError && (
        <div className="p-4 rounded-[14px] bg-[#FA2D48]/10 border border-[#FA2D48]/30 text-black dark:text-white text-xs font-medium flex items-center justify-between">
          <span>{searchError}</span>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#FA2D48] border-t-transparent animate-spin" />
          <p className="text-xs text-[#8E8E93]">Searching Apple Music catalog...</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
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
              <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-full bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-xs font-semibold text-black dark:text-white shadow-xs">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#FA2D48] border-t-transparent animate-spin" />
                <span>Loading more songs…</span>
              </div>
            )}
            {!hasMoreResults && searchResults.length > 0 && !isLoadingMore && (
              <p className="text-xs font-medium text-[#8E8E93] py-2">
                You've reached the end of results.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty / Welcome Search Prompt State */}
      {!isSearching && searchResults.length === 0 && (
        <div className="py-12 px-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FA2D48]/10 flex items-center justify-center mx-auto text-[#FA2D48]">
            <Music2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-black dark:text-white tracking-tight">Search Apple Music</h3>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] max-w-md mx-auto leading-relaxed font-normal pt-1">
              Find any song, artist, album, or soundtrack to start listening immediately.
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-3 block">
              Trending Searches
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {popularQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => {
                    setTypedQuery(query);
                    onSearchChange(query);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#FA2D48] hover:text-white text-xs font-semibold text-black dark:text-white transition shadow-2xs cursor-pointer"
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
