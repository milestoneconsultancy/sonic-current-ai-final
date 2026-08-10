import React, { useState } from 'react';
import { Download, HardDrive, Trash2, Play, Plus, Check, ShieldAlert, Music2 } from 'lucide-react';
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

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloadedSongs,
  storageStats,
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDeleteDownload,
  onClearAllDownloads,
  onAddToQueue,
  onAddAllToQueue,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const songList: Song[] = downloadedSongs.map((d) => ({
    id: d.id,
    title: d.title,
    artist: d.artist,
    album: d.album,
    duration: d.duration,
    artwork: d.artwork,
    url: URL.createObjectURL(d.audioBlob), // Create object URL for offline playback!
    permaUrl: '',
  }));

  return (
    <div className="space-y-6 pb-24">
      {/* Storage Indicator Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Offline IndexedDB Storage</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {storageStats.count} tracks stored offline • {storageStats.formattedSize} used
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-3">
          {downloadedSongs.length > 0 && (
            <>
              <button
                onClick={() => onPlayAll(songList)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> Play Offline
              </button>

              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Downloads
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>Are you sure you want to delete all {downloadedSongs.length} downloaded audio files from IndexedDB?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearAllDownloads();
                setShowConfirmClear(false);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
            >
              Yes, Delete
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
              Click the download icon <Download className="w-3.5 h-3.5 text-emerald-600 inline mx-0.5" /> on any song to save complete 320kbps audio files directly into local browser storage for offline playback anytime.
            </p>
          </div>
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
