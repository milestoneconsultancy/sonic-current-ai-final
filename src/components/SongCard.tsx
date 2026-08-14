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
      className={`group relative p-3 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between select-none ${
        isCurrent
          ? 'bg-slate-900 border-slate-900 dark:bg-amber-500/15 dark:border-amber-500/40 text-white shadow-xl shadow-slate-950/20 ring-1 ring-amber-500/30'
          : 'bg-white border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/90 dark:hover:bg-slate-850 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2.5 shadow-xs">
        {(song.artwork || song.image) ? (
          <img
            src={song.artwork || song.image}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
            <Music2 className="w-8 h-8" />
          </div>
        )}

        {/* Dynamic Equalizer / Play Button */}
        <div
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transition-all duration-300 transform ${
            isCurrent
              ? 'opacity-100 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110'
          }`}
        >
          {isCurrent && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 w-4 h-4">
              <span className="w-1 bg-slate-950 animate-[bounce_0.6s_infinite_100ms] rounded-full h-3" />
              <span className="w-1 bg-slate-950 animate-[bounce_0.6s_infinite_300ms] rounded-full h-full" />
              <span className="w-1 bg-slate-950 animate-[bounce_0.6s_infinite_200ms] rounded-full h-2" />
            </div>
          ) : (
            <Play className="w-4 h-4 fill-current pl-0.5" />
          )}
        </div>

        {/* Downloaded Offline Badge */}
        {isDownloaded && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider shadow flex items-center gap-1">
            <Check className="w-3 h-3" /> Offline
          </div>
        )}
      </div>

      {/* Info & Action Row */}
      <div>
        <h4
          className={`font-bold text-xs sm:text-sm truncate tracking-tight ${
            isCurrent ? 'text-amber-400 dark:text-amber-300 font-black' : 'text-slate-900 dark:text-white'
          }`}
        >
          {song.title}
        </h4>
        <p
          className={`text-[11px] truncate mt-0.5 font-medium ${
            isCurrent ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {song.artist}
        </p>

        {/* Action Row */}
        <div
          className={`flex items-center justify-between mt-2.5 pt-2 border-t text-xs ${
            isCurrent ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(song);
            }}
            aria-label="Like song"
            className={`p-1 rounded-lg transition cursor-pointer ${
              isFavorite
                ? 'text-rose-500'
                : isCurrent
                ? 'text-slate-400 hover:text-rose-300'
                : 'text-slate-400 hover:text-rose-500'
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
            className={`p-1 rounded-lg transition cursor-pointer ${
              isDownloaded
                ? 'text-emerald-500 dark:text-emerald-400'
                : isDownloading
                ? 'text-amber-500'
                : isCurrent
                ? 'text-slate-400 hover:text-emerald-300'
                : 'text-slate-400 hover:text-emerald-500'
            }`}
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            ) : isDownloaded ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
