import React, { useRef, useEffect } from 'react';
import { X, Trash2, ListMusic, Play, ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
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
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border-l border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-black dark:text-white h-full flex flex-col justify-between p-5 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[#FA2D48]" />
            <h3 className="font-bold text-lg text-black dark:text-white tracking-tight">
              Playing Next ({queue.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                title="Clear queue"
                className="px-3 py-1 text-xs font-semibold text-[#FA2D48] hover:bg-[#FA2D48]/10 rounded-full transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#8E8E93] hover:text-black dark:hover:text-white rounded-full hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue Content */}
        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8E8E93] space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93] flex items-center justify-center mx-auto">
              <ListMusic className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-base text-black dark:text-white">Queue is Empty</h4>
            <p className="text-xs font-normal max-w-xs leading-relaxed">
              Select any track or radio station to queue up continuous music.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 my-2 overflow-y-auto">
            {/* HORIZONTAL CAROUSEL */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Upcoming Tracks
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scroll('left')}
                    className="p-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] hover:bg-[#D1D1D6] text-black dark:text-white transition cursor-pointer"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className="p-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] hover:bg-[#D1D1D6] text-black dark:text-white transition cursor-pointer"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Area */}
              <div
                ref={scrollRef}
                className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 scrollbar-none snap-x snap-mandatory scroll-smooth touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {queue.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id && idx === queueIndex;

                  return (
                    <div
                      key={`carousel_${song.id}_${idx}`}
                      onClick={() => onSelectSong(song, idx)}
                      className={`group relative shrink-0 snap-start cursor-pointer rounded-[12px] p-2 transition-all duration-150 select-none ${
                        isCurrent
                          ? 'w-36 bg-[#FA2D48]/10 dark:bg-[#FA2D48]/20 border border-[#FA2D48]'
                          : 'w-32 bg-[#F2F2F7] dark:bg-[#2C2C2E]/60 hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
                      }`}
                    >
                      {/* Artwork 12pt radius */}
                      <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#E5E5EA] dark:bg-[#1C1C1E] mb-1.5">
                        {song.artwork ? (
                          <img
                            src={song.artwork}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                            <Music2 className="w-6 h-6" />
                          </div>
                        )}

                        {/* Hover Play Icon */}
                        <div
                          className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${
                            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              isCurrent ? 'bg-[#FA2D48] text-white' : 'bg-white text-black'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="px-0.5">
                        <h4
                          className={`text-xs truncate ${
                            isCurrent ? 'font-semibold text-[#FA2D48]' : 'font-medium text-black dark:text-white'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-[10px] text-[#8E8E93] truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAILED QUEUE LIST (56px Apple Music Rows) */}
            <div className="space-y-1 pt-2 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50">
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Queue Order
              </span>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {queue.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id && idx === queueIndex;
                  return (
                    <div
                      key={`list_${song.id}_${idx}`}
                      className={`group flex items-center justify-between px-2.5 h-14 min-h-[56px] rounded-[10px] transition ${
                        isCurrent
                          ? 'bg-[#FA2D48]/10 dark:bg-[#FA2D48]/20'
                          : 'hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]/60'
                      }`}
                    >
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        onClick={() => onSelectSong(song, idx)}
                      >
                        <span
                          className={`text-xs font-mono w-4 text-center shrink-0 font-medium ${
                            isCurrent ? 'text-[#FA2D48]' : 'text-[#8E8E93]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <img
                          src={song.artwork || ''}
                          alt=""
                          className="w-10 h-10 rounded-[8px] object-cover bg-[#E5E5EA] dark:bg-[#2C2C2E] shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs truncate ${
                              isCurrent ? 'font-semibold text-[#FA2D48]' : 'font-medium text-black dark:text-white'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-[#8E8E93] truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isCurrent && isPlaying ? (
                          <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full bg-[#FA2D48]">
                            NOW
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectSong(song, idx)}
                            className={`p-1.5 rounded-full ${
                              isCurrent ? 'text-[#FA2D48]' : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveFromQueue(idx)}
                          className="p-1.5 rounded-full text-[#8E8E93] hover:text-[#FA2D48] transition cursor-pointer"
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
        <div className="pt-3 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50 mt-auto">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-[12px] bg-[#FA2D48] hover:bg-[#FC3C44] font-semibold text-sm text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
