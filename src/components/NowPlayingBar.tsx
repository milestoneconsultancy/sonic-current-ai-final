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
  volume,
  isMuted,
  repeatMode,
  shuffleMode,
  isFavorite,
  isDownloaded,
  isDownloading,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
  onToggleShuffle,
  onToggleFavorite,
  onDownload,
  onToggleQueue,
  onExpandPlayer,
}) => {
  if (!currentSong) return null;

  return (
    <div className="fixed z-40 bottom-[72px] sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-lg sm:max-w-xl md:max-w-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 text-white shadow-2xl shadow-slate-950/50 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300 ease-out select-none">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Album Artwork & Song Details (Click to Expand) */}
        <div
          onClick={onExpandPlayer}
          className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial cursor-pointer group"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-slate-900">
            {currentSong.artwork ? (
              <img
                key={currentSong.id}
                src={currentSong.artwork}
                alt={currentSong.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Music2 className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[170px] md:max-w-[210px]">
              {currentSong.title}
            </h4>
            <p className="text-[10px] sm:text-xs font-medium text-slate-300/80 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[170px] md:max-w-[210px]">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Center: Floating Glass Audio Waveform */}
        <div className="hidden xs:flex flex-1 max-w-[160px] sm:max-w-[240px] md:max-w-[300px] items-center px-1">
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            barCount={28}
            variant="dark"
          />
        </div>

        {/* Right: Glass Playback & Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Previous */}
          <button
            onClick={onPrevious}
            aria-label="Previous track"
            title="Previous track"
            className="p-1.5 text-slate-300 hover:text-white transition active:scale-90 rounded-full hover:bg-white/10"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Circular Glass Play/Pause Control */}
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-200 font-bold"
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
            className="p-1.5 text-slate-300 hover:text-white transition active:scale-90 rounded-full hover:bg-white/10"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-white/15 mx-0.5 hidden sm:block" />

          {/* Like / Favorite */}
          <button
            onClick={() => onToggleFavorite(currentSong)}
            aria-label={isFavorite ? 'Remove from Liked' : 'Like song'}
            title={isFavorite ? 'Remove from Liked' : 'Like song'}
            className={`hidden sm:flex p-1.5 rounded-full transition hover:bg-white/10 ${
              isFavorite ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Queue Drawer */}
          <button
            onClick={onToggleQueue}
            aria-label="View queue"
            title="View queue"
            className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Expand Full Player */}
          <button
            onClick={onExpandPlayer}
            aria-label="Full player view"
            title="Full player view"
            className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

