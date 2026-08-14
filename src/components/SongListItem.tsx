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
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 select-none ${
        isCurrent
          ? 'bg-slate-900 border-slate-900 dark:bg-amber-500/15 dark:border-amber-500/40 text-white shadow-md shadow-slate-950/20 ring-1 ring-amber-500/30'
          : 'bg-white border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
      }`}
    >
      {/* Left: Artwork + Title + Artist */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Artwork with Overlay Play/Pause */}
        <div
          onClick={() => onPlay(song)}
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 shadow-xs cursor-pointer group/art"
        >
          {(song.artwork || song.image) ? (
            <img
              src={song.artwork || song.image}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/art:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Music2 className="w-5 h-5" />
            </div>
          )}

          {/* Playing overlay or hover trigger */}
          <div
            className={`absolute inset-0 bg-slate-950/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex items-end justify-center gap-0.5 w-4 h-4">
                <span className="w-1 bg-amber-400 animate-[bounce_0.6s_infinite_100ms] rounded-full h-3" />
                <span className="w-1 bg-amber-400 animate-[bounce_0.6s_infinite_300ms] rounded-full h-full" />
                <span className="w-1 bg-amber-400 animate-[bounce_0.6s_infinite_200ms] rounded-full h-2" />
              </div>
            ) : (
              <Play className="w-4 h-4 text-amber-300 fill-current pl-0.5" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlay(song)}>
          <h4
            className={`font-bold text-xs sm:text-sm truncate leading-snug tracking-tight ${
              isCurrent ? 'text-amber-400 dark:text-amber-300 font-black' : 'text-slate-900 dark:text-white'
            }`}
          >
            {song.title}
          </h4>
          <p
            className={`text-[11px] sm:text-xs truncate mt-0.5 font-medium ${
              isCurrent ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {song.artist} {song.album ? `• ${song.album}` : ''}
          </p>
        </div>
      </div>

      {/* Right Controls: Duration, Favorite, Download, Queue */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
        {/* Duration */}
        <span
          className={`text-[11px] font-mono hidden sm:inline-block w-11 text-right font-medium ${
            isCurrent ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {formatTime(song.duration)}
        </span>

        {/* Add to Queue */}
        <button
          onClick={() => onAddToQueue(song)}
          aria-label="Add to queue"
          title="Add to queue"
          className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
            isCurrent
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Favorite Heart Button */}
        <button
          onClick={() => onToggleFavorite(song)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
            isFavorite
              ? 'text-rose-500'
              : isCurrent
              ? 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
              : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
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
          className={`p-1.5 sm:p-2 rounded-xl transition flex items-center gap-1 cursor-pointer ${
            isDownloaded
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 font-bold border border-emerald-500/30'
              : isDownloading
              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20'
              : isCurrent
              ? 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          ) : isDownloaded ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
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
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              isCurrent
                ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
