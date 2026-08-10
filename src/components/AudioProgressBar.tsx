import React, { useMemo } from 'react';

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  className?: string;
  barCount?: number;
}

export const AudioProgressBar: React.FC<AudioProgressBarProps> = ({
  currentTime,
  duration,
  isPlaying,
  onSeek,
  className = '',
  barCount = 36,
}) => {
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  // Generate deterministic height profiles for the waveform bars so it looks like realistic audio track peaks
  const waveformHeights = useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Pseudo-random peak generation based on sine waves
      const val = Math.abs(
        Math.sin(i * 0.45) * 0.5 + Math.cos(i * 0.8) * 0.3 + Math.sin(i * 0.15) * 0.2
      );
      // Map to height percentage between 20% and 95%
      const pct = Math.round(20 + val * 75);
      heights.push(pct);
    }
    return heights;
  }, [barCount]);

  return (
    <div className={`w-full flex items-center gap-3 text-xs text-slate-500 font-mono select-none ${className}`}>
      {/* Current Time */}
      <span className="w-10 text-right font-bold text-slate-600 shrink-0">{formatTime(currentTime)}</span>

      {/* Interactive Waveform / Equalizer Progress Container */}
      <div className="relative flex-1 h-8 flex items-center group cursor-pointer">
        {/* Visual Waveform Bar Canvas */}
        <div className="w-full h-full flex items-center justify-between gap-[2px] px-0.5">
          {waveformHeights.map((heightPct, idx) => {
            const barPosPercent = (idx / (barCount - 1)) * 100;
            const isPlayed = barPosPercent <= progressPercent;
            const isNearPlayhead = Math.abs(barPosPercent - progressPercent) < 4;

            // Compute dynamic height multiplier if playing
            const animDelay = `${(idx % 6) * 0.15}s`;

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full py-1"
              >
                <div
                  style={{
                    height: `${heightPct}%`,
                    animationDelay: animDelay,
                  }}
                  className={`w-full max-w-[4px] rounded-full transition-all duration-200 ${
                    isPlayed
                      ? 'bg-amber-500 shadow-xs'
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  } ${
                    isPlaying && isPlayed
                      ? 'animate-pulse'
                      : ''
                  } ${
                    isNearPlayhead && isPlaying
                      ? 'scale-y-125 bg-amber-600 shadow-md shadow-amber-500/40'
                      : ''
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Seamless Overlay Track Line for visual progress precision */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-200/80 rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-100 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Invisible Range Input for Accurate Seeking */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Seek track position"
        />
      </div>

      {/* Duration */}
      <span className="w-10 text-left font-bold text-slate-600 shrink-0">{formatTime(duration)}</span>
    </div>
  );
};
