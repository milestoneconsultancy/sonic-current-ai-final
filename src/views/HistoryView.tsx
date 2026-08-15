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
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* View Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[#E5E5EA]/70 dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60">
          <button
            onClick={() => setActiveTab('recentlyPlayed')}
            className={`px-3.5 py-1.5 rounded-[9px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'recentlyPlayed'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#FA2D48]" /> Recently Played ({recentlyPlayed.length})
          </button>
          <button
            onClick={() => setActiveTab('searchHistory')}
            className={`px-3.5 py-1.5 rounded-[9px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'searchHistory'
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#FA2D48]" /> Search History ({searchHistory.length})
          </button>
        </div>

        {/* Clear Action Button */}
        {activeTab === 'recentlyPlayed' && recentlyPlayed.length > 0 && (
          <button
            onClick={onClearRecentlyPlayed}
            className="px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#FA2D48]/15 text-xs font-semibold text-black dark:text-white hover:text-[#FA2D48] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}

        {activeTab === 'searchHistory' && searchHistory.length > 0 && (
          <button
            onClick={onClearSearchHistory}
            className="px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#FA2D48]/15 text-xs font-semibold text-black dark:text-white hover:text-[#FA2D48] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Searches
          </button>
        )}
      </div>

      {/* TAB 1: RECENTLY PLAYED */}
      {activeTab === 'recentlyPlayed' && (
        <div>
          {recentlyPlayed.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-[#FFFFFF] dark:bg-[#1C1C1E] rounded-[20px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 max-w-lg mx-auto p-8 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-black dark:text-white">No Listening History</h4>
                <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal leading-relaxed max-w-sm mx-auto">
                  Tracks you stream will automatically appear here so you can easily jump back to your recent favorites.
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
                  <span className="absolute top-3.5 right-28 text-[10px] font-medium text-[#8E8E93] hidden md:block">
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
            <div className="py-16 text-center space-y-4 bg-[#FFFFFF] dark:bg-[#1C1C1E] rounded-[20px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 max-w-lg mx-auto p-8 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-black dark:text-white">No Search History</h4>
                <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal leading-relaxed max-w-sm mx-auto">
                  Your search terms will be remembered here so you can quickly repeat searches anytime.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectSearchQuery(item.query)}
                  className="group flex items-center justify-between p-3.5 rounded-[14px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#FA2D48] dark:hover:border-[#FA2D48] cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Search className="w-4 h-4 text-[#FA2D48] shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-black dark:text-white truncate">{item.query}</h4>
                      <p className="text-[10px] text-[#8E8E93]">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSearchItem(item.id);
                    }}
                    className="p-1.5 text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
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

