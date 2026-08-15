import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Heart,
  ListMusic,
  Maximize2,
  Music2,
  Download,
  Check,
  Loader2,
} from 'lucide-react';
import { Song, RepeatMode } from '../types';

interface NowPlayingBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
  isFavorite: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onToggleFavorite: (song: Song) => void;
  onDownload: (song: Song) => void;
  onToggleQueue: () => void;
  onExpandPlayer: () => void;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({
  currentSong,
  isPlaying,
  duration,
  currentTime,
  isFavorite,
  isDownloaded,
  isDownloading,
  onPlayPause,
  onNext,
  onSeek,
  onToggleFavorite,
  onDownload,
  onToggleQueue,
  onExpandPlayer,
}) => {
  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed z-40 bottom-[62px] sm:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-xl md:max-w-2xl bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-black dark:text-white shadow-xl rounded-[14px] px-3 py-2 transition-all duration-200 ease-out select-none"
    >
      {/* Top subtle progress line */}
      <div
        className="absolute -top-[1px] left-3 right-3 h-[2px] bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(pct * (duration || 0));
        }}
      >
        <div
          className="h-full bg-[#FA2D48] transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2.5">
        {/* Left: 8pt Album Artwork & Details */}
        <div
          onClick={onExpandPlayer}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-[8px] overflow-hidden shrink-0 shadow-2xs bg-[#E5E5EA] dark:bg-[#2C2C2E]">
            {currentSong.artwork ? (
              <img
                key={currentSong.id}
                src={currentSong.artwork}
                alt={currentSong.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                <Music2 className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-black dark:text-white truncate tracking-tight">
              {currentSong.title}
            </h4>
            <p className="text-xs text-[#8E8E93] truncate mt-0.5">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Right: Playback & Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Like Heart Button */}
          <button
            onClick={() => onToggleFavorite(currentSong)}
            aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className={`p-2 rounded-full transition cursor-pointer ${
              isFavorite ? 'text-[#FA2D48]' : 'text-[#8E8E93] hover:text-[#FA2D48]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Download Button */}
          <button
            onClick={() => onDownload(currentSong)}
            disabled={isDownloading}
            aria-label={isDownloaded ? 'Downloaded' : 'Download'}
            className={`hidden xs:flex p-2 rounded-full transition cursor-pointer ${
              isDownloaded
                ? 'text-[#34C759]'
                : isDownloading
                ? 'text-[#FA2D48]'
                : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
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

          {/* Play/Pause Button in Apple Music Red */}
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white flex items-center justify-center shadow-sm active:scale-95 transition-all duration-150 cursor-pointer mx-1"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current pl-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            aria-label="Next track"
            className="p-2 text-black dark:text-white hover:text-[#FA2D48] transition active:scale-95 rounded-full cursor-pointer"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Queue Button */}
          <button
            onClick={onToggleQueue}
            aria-label="Playing Next Queue"
            className="hidden sm:flex p-2 text-[#8E8E93] hover:text-black dark:hover:text-white rounded-full transition cursor-pointer"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Full Player Expand */}
          <button
            onClick={onExpandPlayer}
            aria-label="Expand Full Player"
            className="p-2 text-[#8E8E93] hover:text-black dark:hover:text-white rounded-full transition cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
