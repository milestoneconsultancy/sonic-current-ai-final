import React, { useState, useMemo } from 'react';
import {
  Download,
  HardDrive,
  Trash2,
  Play,
  Shuffle,
  ShieldAlert,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { Song, DownloadedSong } from '../types';
import { SongListItem } from '../components/SongListItem';

interface DownloadsViewProps {
  downloadedSongs: DownloadedSong[];
  storageStats: { count: number; totalBytes: number; formattedSize: string };
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  onPlaySong: (song: Song) => void;
  onPlayAll: (songs: Song[]) => void;
  onToggleFavorite: (song: Song) => void;
  onDeleteDownload: (songId: string) => void;
  onClearAllDownloads: () => void;
  onAddToQueue: (song: Song) => void;
  onAddAllToQueue: (songs: Song[]) => void;
}

type SortOption = 'recent' | 'title' | 'artist' | 'duration';

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloadedSongs,
  storageStats,
  currentSong,
  isPlaying,
  favoritesSet,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDeleteDownload,
  onClearAllDownloads,
  onAddToQueue,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const songList: Song[] = useMemo(() => {
    let list = downloadedSongs.map((d) => ({
      id: d.id,
      title: d.title,
      artist: d.artist,
      album: d.album,
      duration: d.duration,
      artwork: d.artwork,
      url: '',
      permaUrl: '',
    }));

    // Search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.album && s.album.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'artist') {
        return a.artist.localeCompare(b.artist);
      }
      if (sortBy === 'duration') {
        return parseFloat(b.duration || '0') - parseFloat(a.duration || '0');
      }
      return 0;
    });

    return list;
  }, [downloadedSongs, searchQuery, sortBy]);

  const handleShufflePlay = () => {
    if (songList.length === 0) return;
    const shuffled = [...songList].sort(() => Math.random() - 0.5);
    onPlayAll(shuffled);
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-[16px] bg-[#F2F2F7] dark:bg-[#1C1C1E] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[10px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-0.5">
              Downloaded
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
              Downloaded Music
            </h1>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {storageStats.count} tracks cached locally • {storageStats.formattedSize} storage
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {downloadedSongs.length > 0 && (
            <>
              <button
                onClick={() => onPlayAll(songList)}
                className="px-4 py-2 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play All
              </button>

              <button
                onClick={handleShufflePlay}
                className="px-4 py-2 rounded-full bg-white dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] text-black dark:text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>

              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-3.5 py-2 rounded-full text-[#FA2D48] hover:bg-[#FA2D48]/10 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      {downloadedSongs.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search downloaded songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-[10px] bg-[#E5E5EA]/70 dark:bg-[#1C1C1E] text-xs text-black dark:text-white placeholder-[#8E8E93] focus:outline-none focus:ring-1 focus:ring-[#FA2D48]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
            <span className="text-xs text-[#8E8E93]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-[8px] bg-[#E5E5EA]/70 dark:bg-[#1C1C1E] text-xs font-medium text-black dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="p-4 rounded-[12px] bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Are you sure you want to delete all {downloadedSongs.length} downloaded tracks?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearAllDownloads();
                setShowConfirmClear(false);
              }}
              className="px-4 py-1.5 rounded-full bg-[#FF3B30] hover:bg-[#E02828] text-white font-semibold text-xs cursor-pointer"
            >
              Delete All
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3.5 py-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-black dark:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Downloaded Songs List (56px Rows) */}
      {downloadedSongs.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[16px] max-w-md mx-auto p-8">
          <div className="w-14 h-14 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto">
            <Download className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-black dark:text-white">No Downloaded Music</h3>
            <p className="text-xs text-[#8E8E93] leading-relaxed max-w-sm mx-auto">
              Tap the download button on any track to listen offline without internet.
            </p>
          </div>
        </div>
      ) : songList.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#8E8E93]">
          No downloaded songs match "{searchQuery}"
        </div>
      ) : (
        <div className="space-y-1">
          {songList.map((song) => (
            <SongListItem
              key={song.id}
              song={song}
              isPlaying={isPlaying}
              isCurrent={currentSong?.id === song.id}
              isFavorite={favoritesSet.has(song.id)}
              isDownloaded={true}
              isDownloading={false}
              onPlay={onPlaySong}
              onToggleFavorite={onToggleFavorite}
              onDownload={() => {}}
              onAddToQueue={onAddToQueue}
              onRemove={() => onDeleteDownload(song.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
