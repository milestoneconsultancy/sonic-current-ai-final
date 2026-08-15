import React from 'react';
import { Play, Heart, Download, Check, Loader2, Music2, Plus } from 'lucide-react';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  isFavorite: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  onDownload: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  isCurrent,
  isFavorite,
  isDownloaded,
  isDownloading,
  onPlay,
  onToggleFavorite,
  onDownload,
  onAddToQueue,
}) => {
  return (
    <div
      onClick={() => onPlay(song)}
      className="group relative flex flex-col cursor-pointer select-none"
    >
      {/* Artwork Container - 12pt corner radius */}
      <div className="relative aspect-square w-full rounded-[12px] bg-[#E5E5EA] dark:bg-[#1C1C1E] overflow-hidden mb-2 shadow-xs group-hover:shadow-md transition-all duration-200">
        {(song.artwork || song.image) ? (
          <img
            src={song.artwork || song.image}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
            <Music2 className="w-8 h-8" />
          </div>
        )}

        {/* Dynamic Equalizer / Play Button (Apple Music Red) */}
        <div
          className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-[#FA2D48] text-white flex items-center justify-center shadow-md transition-all duration-200 transform ${
            isCurrent
              ? 'opacity-100 scale-100'
              : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#FC3C44]'
          }`}
        >
          {isCurrent && isPlaying ? (
            <div className="flex items-end justify-center gap-[2px] w-3.5 h-3.5">
              <span className="w-[2px] bg-white animate-apple-eq-1 rounded-full" />
              <span className="w-[2px] bg-white animate-apple-eq-2 rounded-full" />
              <span className="w-[2px] bg-white animate-apple-eq-3 rounded-full" />
              <span className="w-[2px] bg-white animate-apple-eq-4 rounded-full" />
            </div>
          ) : (
            <Play className="w-3.5 h-3.5 fill-current pl-0.5 text-white" />
          )}
        </div>

        {/* Downloaded Badge */}
        {isDownloaded && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#34C759] text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h4
          className={`text-sm truncate leading-snug ${
            isCurrent ? 'font-semibold text-[#FA2D48]' : 'font-medium text-black dark:text-white'
          }`}
        >
          {song.title}
        </h4>
        <p className="text-xs truncate text-[#8E8E93] mt-0.5">
          {song.artist}
        </p>

        {/* Action Row */}
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[#C6C6C8]/25 dark:border-[#38383A]/40 text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(song);
            }}
            aria-label="Favorite"
            className={`p-1 rounded-full transition cursor-pointer ${
              isFavorite
                ? 'text-[#FA2D48]'
                : 'text-[#8E8E93] hover:text-[#FA2D48]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(song);
              }}
              title="Add to Queue"
              aria-label="Add to Queue"
              className="p-1 rounded-full text-[#8E8E93] hover:text-[#FA2D48] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(song);
              }}
              disabled={isDownloading}
              aria-label="Download"
              className={`p-1 rounded-full transition cursor-pointer ${
                isDownloaded
                  ? 'text-[#34C759]'
                  : isDownloading
                  ? 'text-[#FA2D48]'
                  : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA2D48]" />
              ) : isDownloaded ? (
                <Check className="w-3.5 h-3.5 text-[#34C759]" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
