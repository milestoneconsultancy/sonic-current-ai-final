import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  Download,
  ListMusic,
  Maximize2,
  Check,
  Loader2,
  Music2,
  Sparkles,
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

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-slate-200/90 backdrop-blur-2xl px-4 py-2.5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Track Info & Expand Trigger */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div
            onClick={onExpandPlayer}
            className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 shadow-sm cursor-pointer group"
          >
            {currentSong.artwork ? (
              <img src={currentSong.artwork} alt={currentSong.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Music2 className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 cursor-pointer" onClick={onExpandPlayer}>
            <h4 className="font-bold text-sm text-slate-900 truncate">{currentSong.title}</h4>
            <div className="flex items-center gap-2 truncate mt-0.5">
              <p className="text-xs font-medium text-slate-500 truncate">{currentSong.artist}</p>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/80 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                {currentSong.album && currentSong.album !== currentSong.title
                  ? `Context: ${currentSong.album}`
                  : `Context: Artist • ${currentSong.artist}`}
              </span>
            </div>
          </div>

          <button
            onClick={() => onToggleFavorite(currentSong)}
            className={`hidden lg:block p-2 rounded-xl transition ${
              isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Scrubbing Bar */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-1">
          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              title={shuffleMode ? 'Shuffle ON' : 'Shuffle OFF'}
              className={`p-1.5 rounded-lg transition ${
                shuffleMode ? 'text-amber-600 bg-amber-100' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={onPrevious}
              className="p-1.5 text-slate-700 hover:text-slate-950 transition active:scale-90"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md hover:bg-slate-800 hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="p-1.5 text-slate-700 hover:text-slate-950 transition active:scale-90"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={onToggleRepeat}
              title={`Repeat Mode: ${repeatMode.toUpperCase()}`}
              className={`p-1.5 rounded-lg transition relative ${
                repeatMode !== 'off' ? 'text-amber-600 bg-amber-100' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Dynamic Audio Waveform Progress Bar */}
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            barCount={36}
          />
        </div>

        {/* Right: Actions, Volume & Queue Toggle */}
        <div className="flex items-center justify-end gap-2.5 w-1/4">
          {/* Download button */}
          <button
            onClick={() => onDownload(currentSong)}
            disabled={isDownloading}
            title={isDownloaded ? 'Downloaded' : 'Download song'}
            className={`hidden sm:flex p-2 rounded-xl transition ${
              isDownloaded ? 'text-emerald-600 bg-emerald-50' : isDownloading ? 'text-amber-500' : 'text-slate-400 hover:text-teal-700'
            }`}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : isDownloaded ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Queue Drawer Toggle */}
          <button
            onClick={onToggleQueue}
            title="View queue"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2 group">
            <button onClick={onToggleMute} className="text-slate-400 hover:text-slate-800">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 accent-amber-500 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Expand Modal Trigger */}
          <button
            onClick={onExpandPlayer}
            title="Full player view"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
