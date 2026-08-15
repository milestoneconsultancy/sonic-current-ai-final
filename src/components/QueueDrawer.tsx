import React, { useRef, useEffect } from 'react';
import { X, Trash2, ListMusic, Play, Sparkles, ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import { Song } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Song[];
  queueIndex: number;
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song, index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  queueIndex,
  currentSong,
  isPlaying,
  onSelectSong,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Keyboard navigation for queue carousel (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scroll('left');
      } else if (e.key === 'ArrowRight') {
        scroll('right');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1C1C1E] border-l border-[#C6C6C8]/40 dark:border-[#38383A]/60 h-full flex flex-col justify-between p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-[#FA2D48]" />
            <h3 className="font-bold text-lg text-black dark:text-white tracking-tight">Playing Next ({queue.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                title="Clear queue"
                className="px-3 py-1.5 text-xs font-semibold text-[#8E8E93] hover:text-[#FA2D48] hover:bg-[#FA2D48]/10 rounded-full transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#8E8E93] hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smart Queue Indicator */}
        <div className="my-3 p-3 rounded-[14px] bg-[#FA2D48]/10 border border-[#FA2D48]/20 text-xs font-medium flex items-center gap-2 text-black dark:text-white">
          <Sparkles className="w-4 h-4 text-[#FA2D48] shrink-0" />
          <span>Autoplay will keep similar music playing when queue ends</span>
        </div>

        {/* Queue Content */}
        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8E8E93] space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center mx-auto">
              <ListMusic className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-base text-black dark:text-white">Playing Next is Empty</h4>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal max-w-xs leading-relaxed">
              Search for your favorite tracks or tap 'Play' on any song or album to start listening.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-6 my-2">
            {/* HORIZONTAL CAROUSEL SECTION */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Upcoming Carousel
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scroll('left')}
                    className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white transition cursor-pointer"
                    title="Scroll left (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white transition cursor-pointer"
                    title="Scroll right (→)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Area */}
              <div
                ref={scrollRef}
                className="flex items-center gap-3 overflow-x-auto py-3 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {queue.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id && idx === queueIndex;

                  return (
                    <div
                      key={`carousel_${song.id}_${idx}`}
                      onClick={() => onSelectSong(song, idx)}
                      className={`group relative shrink-0 snap-start cursor-pointer rounded-[16px] transition-all duration-200 ease-out select-none ${
                        isCurrent
                          ? 'w-40 bg-[#000000] border-2 border-[#FA2D48] text-white shadow-lg ring-2 ring-[#FA2D48]/30 scale-102'
                          : 'w-36 bg-[#FFFFFF] dark:bg-[#2C2C2E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#FA2D48] text-black dark:text-white hover:scale-[1.03] shadow-xs'
                      }`}
                    >
                      {/* Artwork Container */}
                      <div className="relative aspect-square w-full p-2">
                        <div className="relative w-full h-full rounded-[12px] overflow-hidden bg-[#E5E5EA] dark:bg-[#38383A]">
                          {song.artwork ? (
                            <img
                              src={song.artwork}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                              <Music2 className="w-6 h-6" />
                            </div>
                          )}

                          {/* Hover Play Icon */}
                          <div
                            className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${
                              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                                isCurrent ? 'bg-[#FA2D48] text-white' : 'bg-white text-black'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="px-2.5 pb-2.5">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isCurrent ? 'text-[#FA2D48]' : 'text-black dark:text-white group-hover:text-[#FA2D48]'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className={`text-[10px] font-normal truncate ${isCurrent ? 'text-white/70' : 'text-[#8E8E93]'}`}>
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAILED QUEUE LIST */}
            <div className="space-y-2 pt-2 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-2">
                Up Next Tracklist
              </span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {queue.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id && idx === queueIndex;
                  return (
                    <div
                      key={`list_${song.id}_${idx}`}
                      className={`group flex items-center justify-between p-2 rounded-[12px] border transition ${
                        isCurrent
                          ? 'bg-[#000000] border-[#000000] text-white shadow-xs'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-[#C6C6C8]/30 dark:border-[#38383A]/50 hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] text-black dark:text-white'
                      }`}
                    >
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        onClick={() => onSelectSong(song, idx)}
                      >
                        <span
                          className={`text-[11px] font-mono w-5 text-center shrink-0 font-bold ${
                            isCurrent ? 'text-[#FA2D48]' : 'text-[#8E8E93]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <img
                          src={song.artwork || ''}
                          alt=""
                          className="w-9 h-9 rounded-[6px] object-cover bg-[#E5E5EA] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-semibold truncate ${
                              isCurrent ? 'text-white' : 'text-black dark:text-white'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className={`text-[10px] truncate ${isCurrent ? 'text-white/70' : 'text-[#8E8E93]'}`}>
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isCurrent && isPlaying ? (
                          <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full bg-[#FA2D48]">
                            PLAYING
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectSong(song, idx)}
                            className={`p-1.5 rounded-full ${
                              isCurrent
                                ? 'text-white hover:text-[#FA2D48]'
                                : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveFromQueue(idx)}
                          className={`p-1.5 rounded-full transition ${
                            isCurrent ? 'text-white/60 hover:text-[#FA2D48]' : 'text-[#8E8E93] hover:text-[#FA2D48]'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-4 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50 mt-auto">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] font-semibold text-sm text-white transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
