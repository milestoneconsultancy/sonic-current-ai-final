import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume1,
  Volume2,
  VolumeX,
  Heart,
  Download,
  Check,
  Loader2,
  Music2,
  Mic2,
  Disc,
} from 'lucide-react';
import { Song, RepeatMode } from '../types';
import { QueueCarousel } from './QueueCarousel';
import { AudioProgressBar } from './AudioProgressBar';
import { LyricsView } from './LyricsView';
import { extractGradientFromArtwork, ExtractedColors } from '../lib/colorExtractor';

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
  const [colors, setColors] = useState<ExtractedColors | null>(null);

  // Extract dynamic colors from artwork whenever currentSong changes
  useEffect(() => {
    if (currentSong?.artwork) {
      extractGradientFromArtwork(currentSong.artwork).then(setColors);
    } else {
      setColors(null);
    }
  }, [currentSong?.artwork]);

  if (!isOpen || !currentSong) return null;

  const bgGradient = colors?.darkGradient || 'linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 40%, #000000 100%)';

  return (
    <div
      className="fixed inset-0 z-50 text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto animate-in fade-in duration-300 select-none transition-colors"
      style={{ background: bgGradient }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {currentSong.artwork && (
          <img
            src={currentSong.artwork}
            alt=""
            className="w-full h-full object-cover blur-[90px] scale-150 transform transition-all duration-700"
          />
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto w-full">
        {/* Dismiss chevron */}
        <button
          onClick={onClose}
          aria-label="Dismiss full player"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl transition cursor-pointer text-white/80 hover:text-white"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* View Switcher Pill */}
        <div className="flex items-center bg-white/15 dark:bg-black/30 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-xs">
          <button
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'cover'
                ? 'bg-white text-black shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Artwork</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition cursor-pointer ${
              activeTab === 'lyrics'
                ? 'bg-white text-black shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(currentSong)}
          aria-label={isFavorite ? 'Remove from Liked' : 'Like song'}
          className={`p-2.5 rounded-full backdrop-blur-xl transition cursor-pointer ${
            isFavorite
              ? 'text-[#FA2D48] bg-white/10'
              : 'text-white/70 bg-white/10 hover:text-[#FA2D48] hover:bg-white/20'
          }`}
        >
          <Heart className={`w-6 h-6 ${isFavorite ? 'fill-[#FA2D48]' : ''}`} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-md md:max-w-lg mx-auto w-full my-auto py-4 sm:py-6 flex flex-col items-center">
        {/* Album Artwork (Signature Apple Music Shadow & Scale) OR Live Lyrics */}
        {activeTab === 'cover' ? (
          <div className="flex flex-col items-center justify-center w-full mb-6 sm:mb-8">
            <div
              className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 rounded-[20px] bg-black/40 overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.6)] ring-1 ring-white/15 transition-transform duration-500 ease-out ${
                isPlaying ? 'scale-100' : 'scale-90 opacity-90'
              }`}
            >
              {currentSong.artwork ? (
                <img
                  src={currentSong.artwork}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 bg-zinc-900">
                  <Music2 className="w-20 h-20" />
                </div>
              )}

              {/* Downloaded Badge */}
              {isDownloaded && (
                <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-[#34C759] text-white text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Downloaded
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center mb-6">
            <LyricsView
              song={currentSong}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
            />
          </div>
        )}

        {/* Player Controls & Info Box */}
        <div className="w-full space-y-5">
          {/* Track Metadata */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug truncate">
                {currentSong.title}
              </h1>
              <p className="text-base sm:text-lg font-normal text-white/70 truncate mt-0.5">
                {currentSong.artist}
              </p>
              {currentSong.album && (
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {currentSong.album}
                </p>
              )}
            </div>

            {/* In-app Save / Download button */}
            <button
              onClick={() => onDownload(currentSong)}
              disabled={isDownloading}
              aria-label={isDownloaded ? 'Downloaded' : 'Download for Offline'}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#FA2D48]" />
              ) : isDownloaded ? (
                <Check className="w-5 h-5 text-[#34C759]" />
              ) : (
                <Download className="w-5 h-5 text-white/80" />
              )}
            </button>
          </div>

          {/* Apple Music Scrubber Bar */}
          <div className="px-1">
            <AudioProgressBar
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
              variant="dark"
            />
          </div>

          {/* Main Playback Transport Controls */}
          <div className="flex items-center justify-between px-3 sm:px-6 pt-1">
            {/* Shuffle Button (Active = #FA2D48, Inactive = gray) */}
            <button
              onClick={onToggleShuffle}
              aria-label={shuffleMode ? 'Disable Shuffle' : 'Enable Shuffle'}
              className={`p-3 rounded-full transition cursor-pointer ${
                shuffleMode ? 'text-[#FA2D48] bg-white/10' : 'text-white/60 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous Track */}
            <button
              onClick={onPrevious}
              aria-label="Previous track"
              className="p-3 text-white hover:text-white/80 transition active:scale-90 cursor-pointer"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>

            {/* Apple Music Signature Play/Pause Button */}
            <button
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-16 h-16 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white flex items-center justify-center shadow-lg active:scale-95 transition duration-150 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current pl-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNext}
              aria-label="Next track"
              className="p-3 text-white hover:text-white/80 transition active:scale-90 cursor-pointer"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>

            {/* Repeat Button (Active = #FA2D48, Inactive = gray) */}
            <button
              onClick={onToggleRepeat}
              aria-label={`Repeat mode: ${repeatMode}`}
              className={`p-3 rounded-full transition cursor-pointer ${
                repeatMode !== 'off' ? 'text-[#FA2D48] bg-white/10' : 'text-white/60 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Volume Slider Row (Smooth 0-100% Step by Step) */}
          <div className="flex items-center gap-2.5 px-4 pt-2">
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-white/70 hover:text-white transition active:scale-90 cursor-pointer p-1.5 shrink-0"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#FA2D48]" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-[#FA2D48] bg-white/20 rounded-full cursor-pointer touch-none"
              title={`Volume: ${isMuted ? 0 : Math.round(volume * 100)}%`}
            />
            <span className="text-[11px] font-medium text-white/60 tabular-nums w-8 text-right shrink-0 select-none">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Queue Carousel at Bottom */}
      {queue.length > 0 && (
        <div className="relative z-10 max-w-2xl mx-auto w-full pt-3 border-t border-white/10">
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
