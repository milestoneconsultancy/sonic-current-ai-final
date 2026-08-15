import React from 'react';
import { Play, Heart, Download, Check, Loader2, Music2 } from 'lucide-react';
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
}) => {
  return (
    <div
      onClick={() => onPlay(song)}
      className={`group relative p-2.5 rounded-[16px] border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between select-none ${
        isCurrent
          ? 'bg-[#FA2D48]/5 dark:bg-[#1C1C1E] border-[#FA2D48]/40 ring-1 ring-[#FA2D48]/30 shadow-md'
          : 'bg-[#FFFFFF] dark:bg-[#1C1C1E] border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#C6C6C8] dark:hover:border-[#545458] shadow-xs hover:shadow-md'
      }`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-[12px] bg-[#E5E5EA] dark:bg-[#2C2C2E] overflow-hidden mb-2 shadow-xs">
        {(song.artwork || song.image) ? (
          <img
            src={song.artwork || song.image}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8E8E93] bg-[#E5E5EA] dark:bg-[#2C2C2E]">
            <Music2 className="w-8 h-8" />
          </div>
        )}

        {/* Dynamic Equalizer / Play Button */}
        <div
          className={`absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#FA2D48] text-white flex items-center justify-center shadow-lg transition-all duration-200 transform ${
            isCurrent
              ? 'opacity-100 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105'
          }`}
        >
          {isCurrent && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 w-3.5 h-3.5">
              <span className="w-[2.5px] bg-white animate-apple-eq-1 rounded-full" />
              <span className="w-[2.5px] bg-white animate-apple-eq-2 rounded-full" />
              <span className="w-[2.5px] bg-white animate-apple-eq-3 rounded-full" />
            </div>
          ) : (
            <Play className="w-3.5 h-3.5 fill-current pl-0.5" />
          )}
        </div>

        {/* Lossless / Dolby Atmos Tag */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded-[4px] bg-black/60 backdrop-blur-md text-[8px] font-bold text-[#D4A857] uppercase tracking-wider">
            Lossless
          </span>
        </div>

        {/* Downloaded Offline Badge */}
        {isDownloaded && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-[#34C759] text-white text-[8px] font-bold uppercase tracking-wider shadow flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Info & Action Row */}
      <div>
        <h4
          className={`font-semibold text-xs sm:text-sm truncate tracking-tight ${
            isCurrent ? 'text-[#FA2D48]' : 'text-black dark:text-white'
          }`}
        >
          {song.title}
        </h4>
        <p className="text-[11px] truncate mt-0.5 text-[#3C3C43]/70 dark:text-[#8E8E93]">
          {song.artist}
        </p>

        {/* Action Row */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50 text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(song);
            }}
            aria-label="Like song"
            className={`p-1 rounded-[6px] transition cursor-pointer ${
              isFavorite
                ? 'text-[#FA2D48]'
                : 'text-[#3C3C43]/50 dark:text-[#8E8E93] hover:text-[#FA2D48]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(song);
            }}
            disabled={isDownloading}
            aria-label="Download song"
            className={`p-1 rounded-[6px] transition cursor-pointer ${
              isDownloaded
                ? 'text-[#34C759]'
                : isDownloading
                ? 'text-[#FA2D48]'
                : 'text-[#3C3C43]/50 dark:text-[#8E8E93] hover:text-[#34C759]'
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
  );
};

