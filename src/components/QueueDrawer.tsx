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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col justify-between p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-lg text-slate-900">Playback Queue ({queue.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                title="Clear queue"
                className="p-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smart Queue Indicator */}
        <div className="my-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold flex items-center gap-2 text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Smart Context Autoplay active • Use ← → keys to browse cards</span>
        </div>

        {/* Queue Content */}
        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <ListMusic className="w-8 h-8" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Your Queue is Empty</h4>
            <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
              Search for your favorite songs or click 'Play' on any track to start building your upcoming queue.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-6 my-2">
            {/* HORIZONTAL CAROUSEL SECTION */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Upcoming Queue Carousel
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scroll('left')}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Scroll left (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
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
                      className={`group relative shrink-0 snap-start cursor-pointer rounded-2xl transition-all duration-200 ease-out select-none ${
                        isCurrent
                          ? 'w-40 bg-slate-900 border-2 border-amber-500 text-white shadow-lg ring-2 ring-amber-400/20 scale-102'
                          : 'w-36 bg-white border border-slate-200 hover:border-amber-400 text-slate-900 hover:scale-[1.04] hover:-translate-y-1 hover:shadow-xl shadow-xs'
                      }`}
                    >
                      {/* Artwork Container */}
                      <div className="relative aspect-square w-full p-2">
                        <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                          {song.artwork ? (
                            <img
                              src={song.artwork}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Music2 className="w-6 h-6" />
                            </div>
                          )}

                          {/* Hover Play Icon */}
                          <div
                            className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${
                              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                                isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-900'
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
                          className={`text-xs font-bold truncate ${
                            isCurrent ? 'text-amber-300' : 'text-slate-900 group-hover:text-amber-700'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className={`text-[10px] truncate ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAILED QUEUE LIST */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
                Queue Tracklist
              </span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {queue.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id && idx === queueIndex;
                  return (
                    <div
                      key={`list_${song.id}_${idx}`}
                      className={`group flex items-center justify-between p-2 rounded-xl border transition ${
                        isCurrent
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        onClick={() => onSelectSong(song, idx)}
                      >
                        <span
                          className={`text-[11px] font-mono w-5 text-center shrink-0 font-bold ${
                            isCurrent ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <img
                          src={song.artwork || ''}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover bg-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isCurrent ? 'text-amber-300' : 'text-slate-900'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className={`text-[10px] truncate ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isCurrent && isPlaying ? (
                          <span className="text-[9px] font-mono font-black text-slate-950 px-1.5 py-0.5 rounded bg-amber-400">
                            PLAYING
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectSong(song, idx)}
                            className={`p-1 rounded-lg ${
                              isCurrent
                                ? 'text-slate-300 hover:text-white'
                                : 'text-slate-400 hover:text-slate-800'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveFromQueue(idx)}
                          className={`p-1 transition ${
                            isCurrent ? 'text-slate-400 hover:text-red-300' : 'text-slate-400 hover:text-red-600'
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
        <div className="pt-4 border-t border-slate-200 mt-auto">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-sm text-white transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
