import React from 'react';

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  className?: string;
  barCount?: number;
  variant?: 'light' | 'dark';
}

export const AudioProgressBar: React.FC<AudioProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  className = '',
  variant = 'light',
}) => {
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const isDark = variant === 'dark';

  return (
    <div className={`w-full flex items-center gap-3 text-xs select-none ${className}`}>
      {/* Current Time */}
      <span className={`w-9 text-right font-medium shrink-0 ${isDark ? 'text-white/70' : 'text-[#8E8E93]'}`}>
        {formatTime(currentTime)}
      </span>

      {/* Interactive Apple Music Scrubber Bar */}
      <div className="relative flex-1 h-5 flex items-center group cursor-pointer">
        {/* Background Track */}
        <div
          className={`w-full h-[5px] rounded-full overflow-hidden transition-all duration-150 group-hover:h-[7px] ${
            isDark ? 'bg-white/20' : 'bg-[#E5E5EA] dark:bg-[#2C2C2E]'
          }`}
        >
          {/* Apple Music Red Filled Progress */}
          <div
            className="h-full bg-[#FA2D48] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Apple iOS Scrubbing Thumb / Dot (Appears on hover) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 ring-1 ring-black/10"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />

        {/* Range Input for Accessible Seeking */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Seek playback position"
          aria-label="Seek playback position"
        />
      </div>

      {/* Total Duration or Remaining Time */}
      <span className={`w-9 text-left font-medium shrink-0 ${isDark ? 'text-white/70' : 'text-[#8E8E93]'}`}>
        {formatTime(duration)}
      </span>
    </div>
  );
};
