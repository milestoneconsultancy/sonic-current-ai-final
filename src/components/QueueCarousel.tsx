import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Music2, ListMusic } from 'lucide-react';
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="w-full space-y-2 py-1 select-none">
      {/* Header and Scroll Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-[#FA2D48]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">
            Playing Next ({queue.length})
          </h3>
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
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
        className="flex items-center gap-3 overflow-x-auto py-1 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {queue.map((song, idx) => {
          const isCurrent = currentSong && (song.id === currentSong.id || idx === queueIndex);

          return (
            <div
              key={`${song.id}_${idx}`}
              onClick={() => onSelectSong(song, idx)}
              className={`group relative shrink-0 snap-start cursor-pointer rounded-[12px] p-2 transition-all duration-150 ease-out select-none ${
                isCurrent
                  ? 'w-36 bg-[#FA2D48]/20 border border-[#FA2D48] text-white'
                  : 'w-32 bg-white/10 hover:bg-white/15 border border-white/10 text-white/90'
              }`}
            >
              {/* Artwork Container - 12pt corner radius */}
              <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-black/30 mb-1.5">
                {song.artwork ? (
                  <img
                    src={song.artwork}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <Music2 className="w-6 h-6" />
                  </div>
                )}

                {/* Play Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-150 ${
                    isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
                      isCurrent ? 'bg-[#FA2D48] text-white' : 'bg-white text-black'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="px-0.5">
                <h4
                  className={`text-xs truncate ${
                    isCurrent ? 'font-semibold text-[#FA2D48]' : 'font-medium text-white'
                  }`}
                >
                  {song.title}
                </h4>
                <p className="text-[10px] text-white/60 truncate mt-0.5">
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
