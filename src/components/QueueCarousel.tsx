import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Music2, ListMusic, Sparkles } from 'lucide-react';
import { Song } from '../types';

interface QueueCarouselProps {
  queue: Song[];
  queueIndex: number;
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song, index: number) => void;
}

export const QueueCarousel: React.FC<QueueCarouselProps> = ({
  queue,
  queueIndex,
  currentSong,
  isPlaying,
  onSelectSong,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="w-full space-y-3 py-4">
      {/* Header and Scroll Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Up Next Queue ({queue.length})
          </h3>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-600" /> Autoplay Active
          </span>
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50 shadow-xs transition"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50 shadow-xs transition"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto py-3 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {queue.map((song, idx) => {
          const isCurrent = currentSong && (song.id === currentSong.id || idx === queueIndex);

          return (
            <div
              key={`${song.id}_${idx}`}
              onClick={() => onSelectSong(song, idx)}
              className={`group relative shrink-0 snap-start cursor-pointer rounded-2xl transition-all duration-200 ease-out select-none ${
                isCurrent
                  ? 'w-48 bg-slate-900 border-2 border-amber-500 text-white shadow-xl ring-2 ring-amber-400/20 scale-102'
                  : 'w-44 bg-white border border-slate-200/90 hover:border-amber-400 text-slate-900 hover:scale-[1.04] hover:-translate-y-1 hover:shadow-xl shadow-xs'
              }`}
            >
              {/* Artwork Container */}
              <div className="relative aspect-square w-full p-2.5">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                  {song.artwork ? (
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Music2 className="w-8 h-8" />
                    </div>
                  )}

                  {/* Play Hover Overlay */}
                  <div className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
                    isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition transform ${
                      isCurrent ? 'bg-amber-500 text-slate-950 scale-105' : 'bg-white text-slate-900 group-hover:scale-110'
                    }`}>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Playing Badge */}
                  {isCurrent && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {isPlaying ? 'NOW PLAYING' : 'PAUSED'}
                    </div>
                  )}
                </div>
              </div>

              {/* Text Info */}
              <div className="px-3 pb-3">
                <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-amber-300' : 'text-slate-900 group-hover:text-amber-700'}`}>
                  {song.title}
                </h4>
                <p className={`text-[11px] truncate mt-0.5 font-medium ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                  {song.artist}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
