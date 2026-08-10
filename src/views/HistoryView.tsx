import React, { useState } from 'react';
import { Clock, Search, Trash2, X, Play, Music2 } from 'lucide-react';
import { Song, SearchHistoryItem, RecentlyPlayedItem } from '../types';
import { SongListItem } from '../components/SongListItem';

interface HistoryViewProps {
  searchHistory: SearchHistoryItem[];
  recentlyPlayed: RecentlyPlayedItem[];
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  onSelectSearchQuery: (query: string) => void;
  onRemoveSearchItem: (id: string) => void;
  onClearSearchHistory: () => void;
  onRemoveRecentlyPlayedItem: (id: string) => void;
  onClearRecentlyPlayed: () => void;
  onPlaySong: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  onDownloadSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  searchHistory,
  recentlyPlayed,
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  onSelectSearchQuery,
  onRemoveSearchItem,
  onClearSearchHistory,
  onRemoveRecentlyPlayedItem,
  onClearRecentlyPlayed,
  onPlaySong,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
}) => {
  const [activeTab, setActiveTab] = useState<'recentlyPlayed' | 'searchHistory'>('recentlyPlayed');

  const formatTimestamp = (ts: number) => {
    const diffSeconds = Math.floor((Date.now() - ts) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* View Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('recentlyPlayed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'recentlyPlayed'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-950" /> Recently Played ({recentlyPlayed.length})
          </button>
          <button
            onClick={() => setActiveTab('searchHistory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'searchHistory'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 text-amber-500 dark:text-amber-950" /> Search Queries ({searchHistory.length})
          </button>
        </div>

        {/* Clear Action Button */}
        {activeTab === 'recentlyPlayed' && recentlyPlayed.length > 0 && (
          <button
            onClick={onClearRecentlyPlayed}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Plays
          </button>
        )}

        {activeTab === 'searchHistory' && searchHistory.length > 0 && (
          <button
            onClick={onClearSearchHistory}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Searches
          </button>
        )}
      </div>

      {/* Local Storage Privacy Note */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
        🔒 All history entries are strictly saved in your local browser storage (`localStorage`) and never sent to a remote server.
      </p>

      {/* TAB 1: RECENTLY PLAYED */}
      {activeTab === 'recentlyPlayed' && (
        <div>
          {recentlyPlayed.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 max-w-lg mx-auto p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">No Listening History Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                  Tracks you stream on Free Music will automatically appear here so you can easily jump back to your recent favorites.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentlyPlayed.map((item) => (
                <div key={item.id} className="relative group">
                  <SongListItem
                    song={item.song}
                    isPlaying={isPlaying}
                    isCurrent={currentSong?.id === item.song.id}
                    isFavorite={favoritesSet.has(item.song.id)}
                    isDownloaded={downloadedSet.has(item.song.id)}
                    isDownloading={downloadingSet.has(item.song.id)}
                    onPlay={onPlaySong}
                    onToggleFavorite={onToggleFavorite}
                    onDownload={onDownloadSong}
                    onAddToQueue={onAddToQueue}
                    onRemove={() => onRemoveRecentlyPlayedItem(item.id)}
                  />
                  <span className="absolute top-3.5 right-28 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 hidden md:block">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEARCH QUERIES HISTORY */}
      {activeTab === 'searchHistory' && (
        <div>
          {searchHistory.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 max-w-lg mx-auto p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">No Search History Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                  Your search terms will be remembered here locally so you can quickly repeat popular searches anytime.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectSearchQuery(item.query)}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.query}</h4>
                      <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSearchItem(item.id);
                    }}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
