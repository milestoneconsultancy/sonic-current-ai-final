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
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#FA2D48] fill-current" /> Favorite Songs ({favorites.length})
          </h2>
          <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal mt-1">
            Your collection of saved favorite tracks.
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlayAll(favorites)}
              className="px-4 py-2 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play All
            </button>
            <button
              onClick={() => onAddAllToQueue(favorites)}
              className="px-3.5 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Queue All
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {favorites.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-[#FFFFFF] dark:bg-[#1C1C1E] rounded-[20px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 max-w-lg mx-auto p-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-black dark:text-white">No Favorite Songs Yet</h3>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] leading-relaxed max-w-sm mx-auto">
              Tap the heart icon <Heart className="w-3 h-3 text-[#FA2D48] fill-current inline mx-0.5" /> on any track to add it to your Favorites.
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

