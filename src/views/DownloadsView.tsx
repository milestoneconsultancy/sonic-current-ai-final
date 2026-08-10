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
      url: '', // handlePlaySong looks up IndexedDB directly by song ID
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
      // default: recent (index order in downloadedSongs is newest first)
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
    <div className="space-y-6 pb-24">
      {/* Storage Indicator Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Offline Music Storage</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {storageStats.count} tracks stored offline • {storageStats.formattedSize} used (No Limits)
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {downloadedSongs.length > 0 && (
            <>
              <button
                onClick={() => onPlayAll(songList)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> Play All
              </button>

              <button
                onClick={handleShufflePlay}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>

              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
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
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>Are you sure you want to delete all {downloadedSongs.length} downloaded audio files from local storage?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearAllDownloads();
                setShowConfirmClear(false);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
            >
              Yes, Delete All
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Downloaded Songs List */}
      {downloadedSongs.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/90 max-w-lg mx-auto p-8 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80">
            <Download className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">No Offline Downloads Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-sm mx-auto">
              Click the download icon <Download className="w-3.5 h-3.5 text-emerald-600 inline mx-0.5" /> on any song to save complete audio files directly into local storage for offline playback anytime.
            </p>
          </div>
        </div>
      ) : songList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No downloaded songs match "{searchQuery}"
        </div>
      ) : (
        <div className="space-y-2">
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
              onDownload={() => {}} // Already downloaded
              onAddToQueue={onAddToQueue}
              onRemove={() => onDeleteDownload(song.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

