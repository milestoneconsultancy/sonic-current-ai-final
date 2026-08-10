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
  ListMusic,
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

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/98 backdrop-blur-3xl flex flex-col justify-between p-6 md:p-12 overflow-y-auto animate-in fade-in duration-300">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        {currentSong.artwork && (
          <img
            src={currentSong.artwork}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-150 transform"
          />
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button
          onClick={onClose}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-100 shadow-xs transition"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center flex flex-col items-center">
          <span className="text-base font-black tracking-tight text-slate-900 leading-none">
            SONIC CURRENT
          </span>
          <span className="text-[10px] font-bold text-amber-600 tracking-wider uppercase mt-1">
            MADE BY ONE CLICK SOLUTION
          </span>
        </div>

        <button
          onClick={() => onToggleFavorite(currentSong)}
          className={`p-3 rounded-2xl bg-white border border-slate-200 shadow-xs transition ${
            isFavorite ? 'text-rose-500 border-rose-200 bg-rose-50/50' : 'text-slate-400 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main Body */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Large Album Artwork */}
        <div className="flex justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl bg-slate-100 overflow-hidden shadow-2xl border border-slate-200/80 group">
            {currentSong.artwork ? (
              <img
                src={currentSong.artwork}
                alt={currentSong.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                <Music2 className="w-20 h-20" />
              </div>
            )}
            {/* Download status overlay */}
            {isDownloaded && (
              <div className="absolute top-4 right-4 px-3.5 py-1 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-1.5">
                <Check className="w-4 h-4 text-white" /> Saved Offline
              </div>
            )}
          </div>
        </div>

        {/* Player Info & Controls */}
        <div className="space-y-6 flex flex-col justify-center">
          {/* Song Metadata */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {currentSong.title}
            </h1>
            <p className="text-base sm:text-lg font-bold text-slate-600 mt-1">
              {currentSong.artist}
            </p>
            {currentSong.album && (
              <p className="text-xs font-bold text-amber-700 font-mono mt-1">
                Album: {currentSong.album}
              </p>
            )}
          </div>

          {/* Dynamic Audio Waveform Progress Bar */}
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            barCount={48}
            className="py-2"
          />

          {/* Center Playback Controls */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={onToggleShuffle}
              className={`p-3 rounded-2xl transition ${
                shuffleMode ? 'text-amber-700 bg-amber-100 border border-amber-300' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button onClick={onPrevious} className="p-3 text-slate-700 hover:text-slate-950 transition active:scale-90">
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current pl-1" />}
            </button>

            <button onClick={onNext} className="p-3 text-slate-700 hover:text-slate-950 transition active:scale-90">
              <SkipForward className="w-7 h-7" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-3 rounded-2xl transition ${
                repeatMode !== 'off' ? 'text-amber-700 bg-amber-100 border border-amber-300' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Secondary Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {/* Download Button */}
            <button
              onClick={() => onDownload(currentSong)}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition ${
                isDownloaded
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Downloading...
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Saved Offline
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download Song
                </>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={onToggleMute} className="p-2 text-slate-400 hover:text-slate-800">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-24 h-1.5 accent-amber-500 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Horizontal Carousel Section */}
      {queue.length > 0 && (
        <div className="relative z-10 max-w-4xl mx-auto w-full pt-4 border-t border-slate-200/80">
          <QueueCarousel
            queue={queue}
            queueIndex={queueIndex}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onSelectSong={onSelectSongFromQueue}
          />
        </div>
      )}

      {/* Footer Branding */}
      <div className="relative z-10 text-center text-xs text-slate-500 font-bold uppercase tracking-wider py-4">
        SONIC CURRENT • <span className="text-amber-600">MADE BY ONE CLICK SOLUTION</span>
      </div>
    </div>
  );
};
