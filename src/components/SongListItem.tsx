import React from 'react';
import { Play, Heart, Download, Check, Music2, Loader2, X, Plus } from 'lucide-react';
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
      className={`group relative flex items-center justify-between px-3 h-14 min-h-[56px] rounded-[10px] transition-all duration-150 select-none ${
        isCurrent
          ? 'bg-[#FA2D48]/10 dark:bg-[#FA2D48]/15 text-black dark:text-white'
          : 'hover:bg-[#E5E5EA]/70 dark:hover:bg-[#1C1C1E] text-black dark:text-white'
      }`}
    >
      {/* Left: 8pt thumbnail radius + Title + Artist */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Artwork Thumbnail - 8pt radius */}
        <div
          onClick={() => onPlay(song)}
          className="relative w-10 h-10 rounded-[8px] bg-[#E5E5EA] dark:bg-[#2C2C2E] overflow-hidden shrink-0 shadow-2xs cursor-pointer group/art"
        >
          {(song.artwork || song.image) ? (
            <img
              src={song.artwork || song.image}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover/art:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93]">
              <Music2 className="w-4 h-4" />
            </div>
          )}

          {/* Playing equalizer overlay */}
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex items-end justify-center gap-[2px] w-4 h-4">
                <span className="w-[2px] bg-[#FA2D48] animate-apple-eq-1 rounded-full" />
                <span className="w-[2px] bg-[#FA2D48] animate-apple-eq-2 rounded-full" />
                <span className="w-[2px] bg-[#FA2D48] animate-apple-eq-3 rounded-full" />
                <span className="w-[2px] bg-[#FA2D48] animate-apple-eq-4 rounded-full" />
              </div>
            ) : (
              <Play className="w-3.5 h-3.5 text-white fill-current pl-0.5" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlay(song)}>
          <h4
            className={`text-sm truncate leading-snug tracking-tight ${
              isCurrent ? 'font-semibold text-[#FA2D48]' : 'font-medium text-black dark:text-white'
            }`}
          >
            {song.title}
          </h4>
          <p className="text-xs truncate text-[#8E8E93] mt-0.5">
            {song.artist} {song.album ? `— ${song.album}` : ''}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {/* Duration */}
        <span className="text-xs text-[#8E8E93] hidden sm:inline-block w-10 text-right">
          {formatTime(song.duration)}
        </span>

        {/* Add to Queue */}
        <button
          onClick={() => onAddToQueue(song)}
          aria-label="Add to Queue"
          title="Add to Playing Next"
          className="p-1.5 rounded-full text-[#8E8E93] hover:text-[#FA2D48] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Favorite Heart Button */}
        <button
          onClick={() => onToggleFavorite(song)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-1.5 rounded-full transition cursor-pointer ${
            isFavorite
              ? 'text-[#FA2D48]'
              : 'text-[#8E8E93] hover:text-[#FA2D48] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Download Button */}
        <button
          onClick={() => onDownload(song)}
          disabled={isDownloading}
          aria-label={isDownloaded ? 'Downloaded' : 'Download'}
          title={isDownloaded ? 'Downloaded in Library' : 'Download for Offline Listening'}
          className={`p-1.5 rounded-full transition flex items-center cursor-pointer ${
            isDownloaded
              ? 'text-[#34C759]'
              : isDownloading
              ? 'text-[#FA2D48]'
              : 'text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
          }`}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#FA2D48]" />
          ) : isDownloaded ? (
            <Check className="w-4 h-4 text-[#34C759]" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Optional Remove button */}
        {onRemove && (
          <button
            onClick={() => onRemove(song)}
            aria-label="Remove item"
            title="Remove item"
            className="p-1.5 rounded-full text-[#8E8E93] hover:text-[#FA2D48] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
