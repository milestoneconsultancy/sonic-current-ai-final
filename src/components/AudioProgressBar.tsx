import React, { useMemo } from 'react';

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
  isPlaying,
  onSeek,
  className = '',
  barCount = 28,
  variant = 'light',
}) => {
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  // Deterministic height profile for realistic floating audio wave peaks
  const waveformHeights = useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const val = Math.abs(
        Math.sin(i * 0.45) * 0.45 + Math.cos(i * 0.8) * 0.35 + Math.sin(i * 0.15) * 0.2
      );
      const pct = Math.round(25 + val * 70);
      heights.push(pct);
    }
    return heights;
  }, [barCount]);

  const isDark = variant === 'dark';

  return (
    <div className={`w-full flex items-center gap-2 text-[11px] select-none font-mono ${className}`}>
      {/* Current Time */}
      <span className={`w-8 text-right font-semibold shrink-0 ${isDark ? 'text-slate-300/80' : 'text-slate-600'}`}>
        {formatTime(currentTime)}
      </span>

      {/* Interactive Floating Glass Waveform */}
      <div className="relative flex-1 h-7 flex items-center group cursor-pointer">
        {/* Waveform Bar Canvas */}
        <div className="w-full h-full flex items-center justify-between gap-[2px] px-0.5">
          {waveformHeights.map((heightPct, idx) => {
            const barPosPercent = (idx / (barCount - 1)) * 100;
            const isPlayed = barPosPercent <= progressPercent;
            const animDelay = `${(idx % 8) * 0.12}s`;

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full py-0.5"
              >
                <div
                  style={{
                    height: `${heightPct}%`,
                    animationDelay: animDelay,
                    animationPlayState: isPlaying && isPlayed ? 'running' : 'paused',
                  }}
                  className={`w-full max-w-[3.5px] rounded-full transition-all duration-200 origin-center ${
                    isPlayed
                      ? 'bg-amber-400 shadow-xs shadow-amber-400/40'
                      : isDark
                      ? 'bg-white/20 group-hover:bg-white/30'
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  } ${
                    isPlaying && isPlayed ? 'animate-wave-bar' : ''
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Subtle Bottom Progress Line Overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 h-[2px] rounded-full overflow-hidden pointer-events-none ${
            isDark ? 'bg-white/10' : 'bg-slate-200/80'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-100 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Range Input for Precise Track Seeking */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Seek track position"
          aria-label="Seek track position"
        />
      </div>

      {/* Total Duration */}
      <span className={`w-8 text-left font-semibold shrink-0 ${isDark ? 'text-slate-300/80' : 'text-slate-600'}`}>
        {formatTime(duration)}
      </span>
    </div>
  );
};

