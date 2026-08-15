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
    <div className="space-y-6 pb-28 animate-in fade-in duration-200">
      {/* Header (Apple Music iOS Library Title) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#C6C6C8]/40 dark:border-[#38383A]/60">
        <div>
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-0.5">
            Library
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-[#FA2D48] fill-[#FA2D48]" /> Favorite Songs
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1">
            {favorites.length} {favorites.length === 1 ? 'track' : 'tracks'} loved
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
              className="px-4 py-2 rounded-full bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] text-black dark:text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Queue All
            </button>
          </div>
        )}
      </div>

      {/* List (56px Apple Music Rows) */}
      {favorites.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[16px] max-w-md mx-auto p-8">
          <div className="w-14 h-14 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 fill-current" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-black dark:text-white">No Favorite Songs Yet</h3>
            <p className="text-xs text-[#8E8E93] leading-relaxed max-w-sm mx-auto">
              Tap the heart icon on any song to add it to your Favorites library.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {favorites.map((song) => (
            <SongListItem
              key={song.id}
              song={song}
              isPlaying={isPlaying}
              isCurrent={currentSong?.id === song.id}
              isFavorite={favoritesSet.has(song.id)}
              downloadedSet={downloadedSet}
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
