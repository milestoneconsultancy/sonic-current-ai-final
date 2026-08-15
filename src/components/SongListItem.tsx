import React from 'react';
import { Play, Heart, Download, Plus, Check, Music2, Loader2, X } from 'lucide-react';
import { Song } from '../types';

interface SongListItemProps {
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  isFavorite: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress?: number;
  onPlay: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  onDownload: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onRemove?: (song: Song) => void;
}

export const SongListItem: React.FC<SongListItemProps> = ({
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
  onRemove,
}) => {
  const formatTime = (seconds: number | string) => {
    const secNum = parseInt(String(seconds), 10);
    if (!secNum || isNaN(secNum)) return '0:00';
    const mins = Math.floor(secNum / 60);
    const secs = secNum % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-2 sm:p-2.5 rounded-[12px] border transition-all duration-150 select-none ${
        isCurrent
          ? 'bg-[#FA2D48]/5 dark:bg-[#1C1C1E] border-[#FA2D48]/40 ring-1 ring-[#FA2D48]/30 shadow-xs'
          : 'bg-[#FFFFFF] dark:bg-[#1C1C1E] border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-black dark:text-white shadow-xs'
      }`}
    >
      {/* Left: Artwork + Title + Artist */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Artwork with Overlay Play/Pause */}
        <div
          onClick={() => onPlay(song)}
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-[8px] bg-[#E5E5EA] dark:bg-[#2C2C2E] overflow-hidden shrink-0 shadow-xs cursor-pointer group/art"
        >
          {(song.artwork || song.image) ? (
            <img
              src={song.artwork || song.image}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/art:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93]">
              <Music2 className="w-5 h-5" />
            </div>
          )}

          {/* Playing overlay or hover trigger */}
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex items-end justify-center gap-0.5 w-3.5 h-3.5">
                <span className="w-[2.5px] bg-[#FA2D48] animate-apple-eq-1 rounded-full" />
                <span className="w-[2.5px] bg-[#FA2D48] animate-apple-eq-2 rounded-full" />
                <span className="w-[2.5px] bg-[#FA2D48] animate-apple-eq-3 rounded-full" />
              </div>
            ) : (
              <Play className="w-4 h-4 text-white fill-current pl-0.5" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlay(song)}>
          <div className="flex items-center gap-1.5">
            <h4
              className={`font-semibold text-xs sm:text-sm truncate leading-snug tracking-tight ${
                isCurrent ? 'text-[#FA2D48]' : 'text-black dark:text-white'
              }`}
            >
              {song.title}
            </h4>
            <span className="hidden sm:inline-block px-1 py-0.2 rounded-[3px] bg-black/5 dark:bg-white/10 text-[8px] font-bold text-[#D4A857] uppercase tracking-wider">
              Lossless
            </span>
          </div>
          <p className="text-[11px] sm:text-xs truncate mt-0.5 text-[#3C3C43]/70 dark:text-[#8E8E93]">
            {song.artist} {song.album ? `• ${song.album}` : ''}
          </p>
        </div>
      </div>

      {/* Right Controls: Duration, Favorite, Download, Queue */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
        {/* Duration */}
        <span className="text-[11px] font-normal hidden sm:inline-block w-10 text-right text-[#3C3C43]/60 dark:text-[#8E8E93]">
          {formatTime(song.duration)}
        </span>

        {/* Add to Queue */}
        <button
          onClick={() => onAddToQueue(song)}
          aria-label="Add to queue"
          title="Add to queue"
          className="p-1.5 sm:p-2 rounded-[8px] transition cursor-pointer text-[#3C3C43]/60 dark:text-[#8E8E93] hover:text-[#FA2D48] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Favorite Heart Button */}
        <button
          onClick={() => onToggleFavorite(song)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-1.5 sm:p-2 rounded-[8px] transition cursor-pointer ${
            isFavorite
              ? 'text-[#FA2D48]'
              : 'text-[#3C3C43]/60 dark:text-[#8E8E93] hover:text-[#FA2D48] hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Download Button */}
        <button
          onClick={() => onDownload(song)}
          disabled={isDownloading}
          aria-label={isDownloaded ? 'Downloaded offline' : 'Download song'}
          title={isDownloaded ? 'Downloaded offline' : 'Download song'}
          className={`p-1.5 sm:p-2 rounded-[8px] transition flex items-center gap-1 cursor-pointer ${
            isDownloaded
              ? 'text-[#34C759] bg-[#34C759]/10'
              : isDownloading
              ? 'text-[#FA2D48] bg-[#FA2D48]/10'
              : 'text-[#3C3C43]/60 dark:text-[#8E8E93] hover:text-[#34C759] hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA2D48]" />
          ) : isDownloaded ? (
            <Check className="w-3.5 h-3.5 text-[#34C759]" />
          ) : (
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>

        {/* Optional Remove button */}
        {onRemove && (
          <button
            onClick={() => onRemove(song)}
            aria-label="Remove item"
            title="Remove item"
            className="p-1.5 rounded-[8px] transition cursor-pointer text-[#3C3C43]/60 dark:text-[#8E8E93] hover:text-[#FA2D48] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

