import React from 'react';
import { Heart, Play, Plus, Music2 } from 'lucide-react';
import { Song } from '../types';
import { SongListItem } from '../components/SongListItem';

interface FavoritesViewProps {
  favorites: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  onPlaySong: (song: Song) => void;
  onPlayAll: (songs: Song[]) => void;
  onToggleFavorite: (song: Song) => void;
  onDownloadSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onAddAllToQueue: (songs: Song[]) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
  onAddAllToQueue,
}) => {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" /> Liked Favorites ({favorites.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Your collection of saved tracks stored in local browser storage.
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onPlayAll(favorites)}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-400 dark:text-slate-950" /> Play All
            </button>
            <button
              onClick={() => onAddAllToQueue(favorites)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Queue All
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {favorites.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 max-w-lg mx-auto p-8 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200/80 dark:border-rose-500/30">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">No Liked Songs Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-sm mx-auto">
              Tap the heart icon <Heart className="w-3 h-3 text-rose-500 fill-current inline mx-0.5" /> on any track while searching or playing to save it to your personal collection.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((song) => (
            <SongListItem
              key={song.id}
              song={song}
              isPlaying={isPlaying}
              isCurrent={currentSong?.id === song.id}
              isFavorite={favoritesSet.has(song.id)}
              isDownloaded={downloadedSet.has(song.id)}
              isDownloading={downloadingSet.has(song.id)}
              onPlay={onPlaySong}
              onToggleFavorite={onToggleFavorite}
              onDownload={onDownloadSong}
              onAddToQueue={onAddToQueue}
            />
          ))}
        </div>
      )}
    </div>
  );
};
