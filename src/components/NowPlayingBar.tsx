import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
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
import { AudioProgressBar } from './AudioProgressBar';

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
  onPrevious,
  onNext,
  onSeek,
  onToggleFavorite,
  onDownload,
  onToggleQueue,
  onExpandPlayer,
}) => {
  if (!currentSong) return null;

  return (
    <div className="fixed z-40 bottom-[64px] sm:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-xl md:max-w-2xl bg-[#FFFFFF]/90 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-black dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-[16px] px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300 ease-out select-none">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Album Artwork & Song Details (Click to Expand) */}
        <div
          onClick={onExpandPlayer}
          className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial cursor-pointer group"
        >
          <div className="relative w-11 h-11 rounded-[8px] overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/10 bg-[#E5E5EA] dark:bg-[#2C2C2E]">
            {currentSong.artwork ? (
              <img
                key={currentSong.id}
                src={currentSong.artwork}
                alt={currentSong.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                <Music2 className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-black dark:text-white truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[170px] md:max-w-[210px] tracking-tight">
              {currentSong.title}
            </h4>
            <p className="text-[11px] sm:text-xs font-normal text-[#3C3C43]/70 dark:text-[#EBEBF5]/70 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[170px] md:max-w-[210px]">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Center: Audio Waveform Progress Bar */}
        <div className="hidden xs:flex flex-1 max-w-[150px] sm:max-w-[220px] md:max-w-[280px] items-center px-1">
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            barCount={24}
            variant="dark"
          />
        </div>

        {/* Right: Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Previous */}
          <button
            onClick={onPrevious}
            aria-label="Previous track"
            title="Previous track"
            className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition active:scale-90 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Center Play/Pause Button */}
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white flex items-center justify-center shadow-md shadow-[#FA2D48]/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current pl-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            aria-label="Next track"
            title="Next track"
            className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition active:scale-90 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-[#C6C6C8]/40 dark:bg-[#38383A]/60 mx-0.5 hidden sm:block" />

          {/* Like */}
          <button
            onClick={() => onToggleFavorite(currentSong)}
            aria-label={isFavorite ? 'Remove from Liked' : 'Like song'}
            title={isFavorite ? 'Remove from Liked' : 'Like song'}
            className={`hidden sm:flex p-1.5 rounded-full transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer ${
              isFavorite ? 'text-[#FA2D48]' : 'text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 hover:text-[#FA2D48]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Download status / action */}
          <button
            onClick={() => onDownload(currentSong)}
            disabled={isDownloading}
            aria-label={isDownloaded ? 'Downloaded' : 'Download track'}
            title={isDownloaded ? 'Downloaded offline' : 'Download track'}
            className={`hidden sm:flex p-1.5 rounded-full transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer ${
              isDownloaded
                ? 'text-[#34C759]'
                : isDownloading
                ? 'text-[#FA2D48]'
                : 'text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 hover:text-[#34C759]'
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

          {/* Queue Drawer */}
          <button
            onClick={onToggleQueue}
            aria-label="View queue"
            title="View queue"
            className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Expand Full Player */}
          <button
            onClick={onExpandPlayer}
            aria-label="Full player view"
            title="Full player view"
            className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

