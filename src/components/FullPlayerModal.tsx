import React, { useState } from 'react';
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
  Mic2,
  Disc,
} from 'lucide-react';
import { Song, RepeatMode } from '../types';
import { QueueCarousel } from './QueueCarousel';
import { AudioProgressBar } from './AudioProgressBar';
import { DancingBaby } from './DancingBaby';
import { LyricsView } from './LyricsView';

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
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics'>('cover');

  if (!isOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto animate-in fade-in duration-300 select-none">
      {/* Dynamic Blurred Artwork Background Glow Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-35">
        {currentSong.artwork && (
          <img
            src={currentSong.artwork}
            alt=""
            className="w-full h-full object-cover blur-[90px] scale-125 transform transition-all duration-700"
          />
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={onClose}
          aria-label="Dismiss full player"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition cursor-pointer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* View Mode Switcher Pill */}
        <div className="flex items-center bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/15 p-1 rounded-full shadow-lg">
          <button
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'cover'
                ? 'bg-[#FA2D48] text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cover</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'lyrics'
                ? 'bg-[#FA2D48] text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
        </div>

        <button
          onClick={() => onToggleFavorite(currentSong)}
          aria-label={isFavorite ? 'Remove from Liked' : 'Like song'}
          className={`p-2.5 rounded-full border backdrop-blur-md transition cursor-pointer ${
            isFavorite
              ? 'text-[#FA2D48] border-[#FA2D48]/40 bg-[#FA2D48]/20'
              : 'text-white/70 border-white/10 bg-white/10 hover:text-[#FA2D48]'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main Body Grid */}
      <div className="relative z-10 max-w-3xl mx-auto w-full my-auto py-4 sm:py-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
        {/* Left Column: Album Artwork & Companion OR Live Lyrics View */}
        {activeTab === 'cover' ? (
          <div className="flex flex-col items-center justify-center relative">
            <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-[20px] bg-[#1C1C1E] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] border border-white/15 group">
              {currentSong.artwork ? (
                <img
                  src={currentSong.artwork}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8E8E93] bg-[#1C1C1E]">
                  <Music2 className="w-16 h-16" />
                </div>
              )}

              {/* Offline Badge */}
              {isDownloaded && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#34C759] text-white text-[9px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Offline
                </div>
              )}
            </div>

            {/* Dancing Baby Companion */}
            <div className="absolute -bottom-6 -right-2 sm:-right-4 md:-right-6 z-20">
              <DancingBaby isPlaying={isPlaying} song={currentSong} />
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <LyricsView
              song={currentSong}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
            />
          </div>
        )}

        {/* Player Info & Controls */}
        <div className="space-y-5 flex flex-col justify-center">
          {/* Song Metadata */}
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-[4px] bg-[#D4A857]/20 text-[#D4A857] text-[10px] font-bold tracking-wider uppercase">
                Spatial Audio
              </span>
              <span className="px-2 py-0.5 rounded-[4px] bg-white/10 text-[#8E8E93] text-[10px] font-bold tracking-wider uppercase">
                Apple Lossless
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug line-clamp-2">
              {currentSong.title}
            </h1>
            <p className="text-base sm:text-lg font-medium text-[#EBEBF5]/70 truncate">
              {currentSong.artist}
            </p>
            {currentSong.album && (
              <p className="text-xs font-semibold text-[#8E8E93] truncate">
                {currentSong.album}
              </p>
            )}
          </div>

          {/* Scrubber Waveform Container */}
          <div className="bg-[#1C1C1E]/70 border border-white/10 backdrop-blur-xl p-3 rounded-[16px] shadow-inner">
            <AudioProgressBar
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
              barCount={36}
              variant="dark"
            />
          </div>

          {/* Main Playback Controls Row */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={onToggleShuffle}
              aria-label={shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
              className={`p-2.5 rounded-full transition cursor-pointer ${
                shuffleMode
                  ? 'text-[#FA2D48] bg-[#FA2D48]/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={onPrevious}
              aria-label="Previous track"
              className="p-2.5 text-white/90 hover:text-white transition active:scale-90 cursor-pointer"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            {/* Apple Music Signature 64pt Red Play Button */}
            <button
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-16 h-16 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white flex items-center justify-center shadow-xl shadow-[#FA2D48]/40 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current pl-1" />
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              className="p-2.5 text-white/90 hover:text-white transition active:scale-90 cursor-pointer"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              aria-label={`Repeat mode ${repeatMode}`}
              className={`p-2.5 rounded-full transition cursor-pointer ${
                repeatMode !== 'off'
                  ? 'text-[#FA2D48] bg-[#FA2D48]/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Secondary Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            {/* Download Button */}
            <button
              onClick={() => onDownload(currentSong)}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition backdrop-blur-md cursor-pointer ${
                isDownloaded
                  ? 'bg-[#34C759]/20 border-[#34C759]/40 text-[#34C759]'
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/15'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA2D48]" /> Downloading...
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34C759]" /> Downloaded
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download
                </>
              )}
            </button>

            {/* Quick Lyrics Toggle Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'lyrics' ? 'cover' : 'lyrics')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition backdrop-blur-md cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-[#FA2D48]/20 border-[#FA2D48]/40 text-[#FA2D48]'
                  : 'bg-white/10 border-white/10 text-white/80 hover:text-white hover:bg-white/15'
              }`}
              title="Toggle Live Lyrics"
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>{activeTab === 'lyrics' ? 'Cover' : 'Lyrics'}</span>
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 text-white/70 hover:text-white transition cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#FA2D48]" />
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
                className="w-16 sm:w-20 h-1.5 accent-[#FA2D48] bg-white/20 rounded-lg cursor-pointer"
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



