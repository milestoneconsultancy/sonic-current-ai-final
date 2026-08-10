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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('recentlyPlayed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recentlyPlayed'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" /> Recently Played ({recentlyPlayed.length})
          </button>
          <button
            onClick={() => setActiveTab('searchHistory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'searchHistory'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-amber-500" /> Search Queries ({searchHistory.length})
          </button>
        </div>

        {/* Clear Action Button */}
        {activeTab === 'recentlyPlayed' && recentlyPlayed.length > 0 && (
          <button
            onClick={onClearRecentlyPlayed}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-xs font-bold text-slate-600 hover:text-red-600 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Plays
          </button>
        )}

        {activeTab === 'searchHistory' && searchHistory.length > 0 && (
          <button
            onClick={onClearSearchHistory}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-xs font-bold text-slate-600 hover:text-red-600 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Searches
          </button>
        )}
      </div>

      {/* Local Storage Privacy Note */}
      <p className="text-[11px] text-slate-500 font-mono font-bold">
        🔒 All history entries are strictly saved in your local browser storage (`localStorage`) and never sent to a remote server.
      </p>

      {/* TAB 1: RECENTLY PLAYED */}
      {activeTab === 'recentlyPlayed' && (
        <div>
          {recentlyPlayed.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/90 max-w-lg mx-auto p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900">No Listening History Yet</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                  Tracks you stream on Sonic Current will automatically appear here so you can easily jump back to your recent favorites.
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
                  <span className="absolute top-3.5 right-28 text-[10px] font-mono font-bold text-slate-400 hidden md:block">
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
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/90 max-w-lg mx-auto p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900">No Search History Yet</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
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
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:bg-slate-50 cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Search className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.query}</h4>
                      <p className="text-[10px] font-mono font-bold text-slate-400">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSearchItem(item.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
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
