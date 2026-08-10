import React from 'react';

interface DancingBabyProps {
  isPlaying: boolean;
  className?: string;
}

export const DancingBaby: React.FC<DancingBabyProps> = ({ isPlaying, className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`relative flex flex-col items-center justify-center select-none pointer-events-none ${className}`}
    >
      {/* Glass Pedestal Background */}
      <div className="relative group">
        {/* Glow halo when playing */}
        {isPlaying && (
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-300/30 blur-md animate-pulse" />
        )}

        {/* Baby Vector Graphic */}
        <div
          className={`relative w-20 h-24 sm:w-24 sm:h-28 transition-transform duration-500 ${
            isPlaying ? 'animate-baby-dance' : 'scale-95 opacity-90'
          }`}
        >
          <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-lg">
            {/* Headphones Headband */}
            <path
              d="M 30 45 A 32 32 0 0 1 90 45"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Baby Head */}
            <g className={isPlaying ? 'animate-baby-head' : ''}>
              {/* Head Circle */}
              <circle cx="60" cy="52" r="26" fill="#fde68a" />
              {/* Hair Tuft */}
              <path
                d="M 58 26 C 56 18, 62 16, 60 12 C 64 16, 64 22, 62 26 Z"
                fill="#d97706"
              />
              {/* Rosy Cheeks */}
              <circle cx="44" cy="58" r="4.5" fill="#f87171" opacity="0.6" />
              <circle cx="76" cy="58" r="4.5" fill="#f87171" opacity="0.6" />

              {/* Eyes */}
              {isPlaying ? (
                // Happy Arc Eyes when dancing
                <g stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none">
                  <path d="M 44 50 Q 50 44 54 50" />
                  <path d="M 66 50 Q 70 44 76 50" />
                </g>
              ) : (
                // Open Cute Eyes when idle
                <g fill="#1e293b">
                  <circle cx="48" cy="50" r="3.5" />
                  <circle cx="72" cy="50" r="3.5" />
                  <circle cx="49.5" cy="48.5" r="1.2" fill="#ffffff" />
                  <circle cx="73.5" cy="48.5" r="1.2" fill="#ffffff" />
                </g>
              )}

              {/* Mouth */}
              <path
                d="M 52 62 Q 60 70 68 62"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Headphones Ear Cups */}
              <rect x="25" y="40" width="10" height="22" rx="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
              <rect x="85" y="40" width="10" height="22" rx="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
              <rect x="28" y="44" width="4" height="14" rx="2" fill="#fbbf24" />
              <rect x="88" y="44" width="4" height="14" rx="2" fill="#fbbf24" />
            </g>

            {/* Baby Body */}
            <g>
              {/* Onesie Body */}
              <path
                d="M 42 74 C 42 72, 78 72, 78 74 C 84 95, 80 110, 60 110 C 40 110, 36 95, 42 74 Z"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
              {/* Music Note on Onesie */}
              <path
                d="M 58 84 L 58 96 M 58 84 L 65 82 L 65 92 M 58 90 A 2.5 2.5 0 1 1 53 90 A 2.5 2.5 0 1 1 58 90 M 65 92 A 2.5 2.5 0 1 1 60 92 A 2.5 2.5 0 1 1 65 92"
                fill="#0284c7"
                stroke="#0284c7"
                strokeWidth="1"
              />

              {/* Left Arm */}
              <g className={isPlaying ? 'animate-baby-arm-left' : ''}>
                <path
                  d="M 40 78 Q 28 85 24 95"
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </g>

              {/* Right Arm */}
              <g className={isPlaying ? 'animate-baby-arm-right' : ''}>
                <path
                  d="M 80 78 Q 92 85 96 95"
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </g>

              {/* Legs / Feet */}
              <circle cx="48" cy="112" r="6" fill="#fde68a" />
              <circle cx="72" cy="112" r="6" fill="#fde68a" />
            </g>
          </svg>
        </div>

        {/* Small Glass Base with Badge */}
        <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[9px] font-black tracking-wider text-amber-300 uppercase shadow-sm text-center">
          {isPlaying ? 'DANCING ♪' : 'IDLE'}
        </div>
      </div>
    </div>
  );
};
