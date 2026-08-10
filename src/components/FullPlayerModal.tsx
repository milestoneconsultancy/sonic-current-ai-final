import React from 'react';
import {
  ChevronDown,
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
  Check,
  Loader2,
  Music2,
  Sparkles,
} from 'lucide-react';
import { Song, RepeatMode } from '../types';
import { QueueCarousel } from './QueueCarousel';
import { AudioProgressBar } from './AudioProgressBar';

interface FullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  queue: Song[];
  queueIndex: number;
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
  onSelectSongFromQueue: (song: Song, index: number) => void;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  isOpen,
  onClose,
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
  queue,
  queueIndex,
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
  onSelectSongFromQueue,
}) => {
  if (!isOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-3xl text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto animate-in fade-in duration-300 select-none">
      {/* Dynamic Blurred Artwork Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {currentSong.artwork && (
          <img
            src={currentSong.artwork}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-125 transform transition-all duration-700"
          />
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={onClose}
          aria-label="Dismiss full player"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white backdrop-blur-md transition shadow-md"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center flex flex-col items-center">
          <span className="text-sm font-black tracking-wider text-white/90 uppercase">
            Now Playing
          </span>
          <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1 mt-0.5">
            <Sparkles className="w-2.5 h-2.5" /> FREE MUSIC
          </span>
        </div>

        <button
          onClick={() => onToggleFavorite(currentSong)}
          aria-label={isFavorite ? 'Remove from Liked' : 'Like song'}
          className={`p-2.5 rounded-full border backdrop-blur-md transition shadow-md ${
            isFavorite
              ? 'text-rose-400 border-rose-500/40 bg-rose-500/15'
              : 'text-slate-300 border-white/10 bg-white/10 hover:text-rose-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main Body Grid */}
      <div className="relative z-10 max-w-3xl mx-auto w-full my-auto py-4 sm:py-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
        {/* Centered Album Artwork */}
        <div className="flex justify-center">
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl bg-slate-900 overflow-hidden shadow-2xl border border-white/20 group">
            {currentSong.artwork ? (
              <img
                src={currentSong.artwork}
                alt={currentSong.title}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                <Music2 className="w-16 h-16" />
              </div>
            )}

            {/* Offline Badge */}
            {isDownloaded && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Offline
              </div>
            )}
          </div>
        </div>

        {/* Player Info & Controls */}
        <div className="space-y-5 flex flex-col justify-center">
          {/* Song Metadata */}
          <div className="text-center md:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug line-clamp-2">
              {currentSong.title}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-slate-300/90 mt-1 truncate">
              {currentSong.artist}
            </p>
            {currentSong.album && (
              <p className="text-xs font-bold text-amber-400 font-mono mt-1 truncate">
                {currentSong.album}
              </p>
            )}
          </div>

          {/* Floating Glass Waveform */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-3 rounded-2xl shadow-inner">
            <AudioProgressBar
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
              barCount={36}
              variant="dark"
            />
          </div>

          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={onToggleShuffle}
              aria-label={shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
              className={`p-2.5 rounded-full transition ${
                shuffleMode
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onPrevious}
              aria-label="Previous track"
              className="p-2.5 text-slate-200 hover:text-white transition active:scale-90"
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>

            <button
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition duration-200 font-bold"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current pl-1" />
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              className="p-2.5 text-slate-200 hover:text-white transition active:scale-90"
            >
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              aria-label={`Repeat mode ${repeatMode}`}
              className={`p-2.5 rounded-full transition ${
                repeatMode !== 'off'
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Secondary Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            {/* Download Button */}
            <button
              onClick={() => onDownload(currentSong)}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition backdrop-blur-md ${
                isDownloaded
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> Downloading...
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved Offline
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Save Offline
                </>
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 text-slate-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
                title="Volume"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Horizontal Carousel Section */}
      {queue.length > 0 && (
        <div className="relative z-10 max-w-3xl mx-auto w-full pt-2 border-t border-white/10">
          <QueueCarousel
            queue={queue}
            queueIndex={queueIndex}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onSelectSong={onSelectSongFromQueue}
          />
        </div>
      )}
    </div>
  );
};

