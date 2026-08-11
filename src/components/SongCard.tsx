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
  onAddToQueue,
}) => {
  return (
    <div
      onClick={() => onPlay(song)}
      className={`group relative p-3.5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
        isCurrent
          ? 'bg-slate-900 border-slate-900 dark:bg-amber-500/20 dark:border-amber-500/40 text-white shadow-xl shadow-slate-900/10'
          : 'bg-white border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3 shadow-xs">
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

        {/* Floating Play Button */}
        <div
          className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transition-all duration-300 transform ${
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
            <Play className="w-5 h-5 fill-current pl-0.5" />
          )}
        </div>

        {/* Downloaded Badge */}
        {isDownloaded && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold shadow flex items-center gap-1">
            <Check className="w-3 h-3" /> Offline
          </div>
        )}
      </div>

      {/* Info & Actions */}
      <div>
        <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-amber-400 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
          {song.title}
        </h4>
        <p className={`text-xs truncate mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{song.artist}</p>

        {/* Action Row */}
        <div className={`flex items-center justify-between mt-3 pt-2 border-t text-xs ${isCurrent ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(song);
            }}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isFavorite
                ? 'text-rose-500'
                : isCurrent
                ? 'text-slate-400 hover:text-rose-300'
                : 'text-slate-400 dark:text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(song);
            }}
            disabled={isDownloading}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDownloaded
                ? 'text-emerald-600 dark:text-emerald-400'
                : isDownloading
                ? 'text-amber-500'
                : isCurrent
                ? 'text-slate-400 hover:text-emerald-300'
                : 'text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : isDownloaded ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
