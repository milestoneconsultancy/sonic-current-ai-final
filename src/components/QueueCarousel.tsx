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
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="w-full space-y-3 py-2">
      {/* Header and Scroll Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white/90">
            Up Next ({queue.length})
          </h3>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-400" /> Autoplay
          </span>
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white transition"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white transition"
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3.5 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {queue.map((song, idx) => {
          const isCurrent = currentSong && (song.id === currentSong.id || idx === queueIndex);

          return (
            <div
              key={`${song.id}_${idx}`}
              onClick={() => onSelectSong(song, idx)}
              className={`group relative shrink-0 snap-center cursor-pointer rounded-2xl transition-all duration-300 ease-out select-none backdrop-blur-xl ${
                isCurrent
                  ? 'w-44 bg-amber-500/15 border-2 border-amber-400/80 text-white shadow-lg shadow-amber-500/10 scale-102 ring-1 ring-amber-400/30'
                  : 'w-40 bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10 text-slate-200 hover:scale-[1.03] shadow-md'
              }`}
            >
              {/* Artwork Container */}
              <div className="relative aspect-square w-full p-2">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-white/10">
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition transform ${
                      isCurrent ? 'bg-amber-400 text-slate-950 scale-105' : 'bg-white text-slate-900 group-hover:scale-110'
                    }`}>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Playing Badge */}
                  {isCurrent && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {isPlaying ? 'PLAYING' : 'PAUSED'}
                    </div>
                  )}
                </div>
              </div>

              {/* Text Info */}
              <div className="px-2.5 pb-2.5">
                <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-amber-300' : 'text-white group-hover:text-amber-200'}`}>
                  {song.title}
                </h4>
                <p className={`text-[11px] truncate mt-0.5 font-medium ${isCurrent ? 'text-slate-200/90' : 'text-slate-400'}`}>
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

