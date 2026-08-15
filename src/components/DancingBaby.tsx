import React, { useState, useEffect } from 'react';
import { Song } from '../types';

export interface DancingBabyProps {
  isPlaying: boolean;
  song?: Song | null;
  className?: string;
}

type ManualSpeed = 'slow' | 'normal' | 'fast';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Generate a deterministic hash-based RGB color as fallback for CORS or missing artwork
function getHashColor(str: string): RgbColor {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 70; // saturation
  const l = 50; // lightness
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// Extract dominant color from artwork canvas or fallback to hash color
function extractArtworkColor(url?: string, seedText?: string): Promise<RgbColor> {
  return new Promise((resolve) => {
    const fallback = getHashColor(seedText || 'music_baby');
    if (!url) return resolve(fallback);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;

    let timer = setTimeout(() => {
      resolve(fallback);
    }, 1200);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fallback);

        ctx.drawImage(img, 0, 0, 16, 16);
        const imgData = ctx.getImageData(0, 0, 16, 16).data;
        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a > 128) {
            const brightness = (r + g + b) / 3;
            if (brightness > 30 && brightness < 230) {
              totalR += r;
              totalG += g;
              totalB += b;
              count++;
            }
          }
        }

        if (count > 0) {
          resolve({
            r: Math.round(totalR / count),
            g: Math.round(totalG / count),
            b: Math.round(totalB / count),
          });
        } else {
          resolve(fallback);
        }
      } catch {
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(fallback);
    };
  });
}

export const DancingBaby: React.FC<DancingBabyProps> = ({
  isPlaying,
  song,
  className = '',
}) => {
  // If no song is active, baby is hidden/unmounted per requirement 13
  if (!song) return null;

  // Manual speed selection state
  const [userSpeed, setUserSpeed] = useState<ManualSpeed>(() => {
    try {
      const saved = localStorage.getItem('sonic_baby_dance_speed');
      if (saved === 'slow' || saved === 'normal' || saved === 'fast') return saved;
    } catch {
      // ignore
    }
    return 'normal';
  });

  const handleSetSpeed = (speed: ManualSpeed) => {
    setUserSpeed(speed);
    try {
      localStorage.setItem('sonic_baby_dance_speed', speed);
    } catch {
      // ignore
    }
  };

  // Motion state: 'playing' | 'settling' | 'idle'
  const [motionState, setMotionState] = useState<'playing' | 'settling' | 'idle'>(
    isPlaying ? 'playing' : 'idle'
  );

  useEffect(() => {
    if (isPlaying) {
      setMotionState('playing');
    } else {
      setMotionState('settling');
      const timer = setTimeout(() => {
        setMotionState('idle');
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  // Dynamic Artwork Color state for ambient halo
  const [artworkColor, setArtworkColor] = useState<RgbColor>({ r: 245, g: 158, b: 11 });

  useEffect(() => {
    let isCancelled = false;
    const seed = song ? `${song.title}_${song.artist}` : 'music_baby';
    extractArtworkColor(song?.artwork, seed).then((color) => {
      if (!isCancelled) {
        setArtworkColor(color);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [song?.id, song?.artwork]);

  // Determine dance duration in seconds based on BPM or manual speed control
  let danceDuration = 0.75; // Default Normal (1.0x)
  let isBpmDriven = false;

  if (song?.bpm && typeof song.bpm === 'number' && song.bpm > 40 && song.bpm < 240) {
    isBpmDriven = true;
    const rawDuration = (60 / song.bpm) * 1.5;
    danceDuration = Math.min(Math.max(rawDuration, 0.45), 1.35);
  } else {
    if (userSpeed === 'slow') danceDuration = 1.15;
    else if (userSpeed === 'fast') danceDuration = 0.48;
    else danceDuration = 0.75;
  }

  const colorRgbStr = `${artworkColor.r}, ${artworkColor.g}, ${artworkColor.b}`;

  return (
    <div
      aria-hidden="true"
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      <div className="relative group flex flex-col items-center">
        {/* Ambient Color Glow (Smooth 700ms transition on artwork color change) */}
        <div
          className="absolute -inset-3 rounded-full blur-xl transition-all duration-700 ease-in-out pointer-events-none opacity-80"
          style={{
            background: `radial-gradient(circle, rgba(${colorRgbStr}, ${motionState === 'playing' ? 0.45 : 0.2}) 0%, rgba(${colorRgbStr}, 0) 70%)`,
          }}
        />

        {/* Baby SVG Container */}
        <div
          className={`relative w-20 h-24 sm:w-24 sm:h-28 transition-all duration-700 ease-out pointer-events-none ${
            motionState === 'playing' ? 'scale-100 opacity-100' : 'scale-95 opacity-90'
          }`}
        >
          <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-xl">
            {/* Headphones Headband */}
            <path
              d="M 30 45 A 32 32 0 0 1 90 45"
              fill="none"
              stroke={`rgb(${colorRgbStr})`}
              strokeWidth="6"
              strokeLinecap="round"
              className="transition-colors duration-700"
            />

            {/* Baby Head */}
            <g
              className={motionState === 'playing' ? 'animate-baby-head' : ''}
              style={{
                animationDuration: `${danceDuration}s`,
                transformOrigin: '60px 70px',
                transition: motionState !== 'playing' ? 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                transform: motionState !== 'playing' ? 'rotate(0deg) translateY(0px)' : undefined,
              }}
            >
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
              {motionState === 'playing' ? (
                // Happy Arc Eyes when dancing
                <g stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none">
                  <path d="M 44 50 Q 50 44 54 50" />
                  <path d="M 66 50 Q 70 44 76 50" />
                </g>
              ) : (
                // Open Cute Eyes when idle/settling
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
              <rect
                x="25"
                y="40"
                width="10"
                height="22"
                rx="5"
                fill={`rgb(${colorRgbStr})`}
                stroke="#1e293b"
                strokeWidth="1.5"
                className="transition-colors duration-700"
              />
              <rect
                x="85"
                y="40"
                width="10"
                height="22"
                rx="5"
                fill={`rgb(${colorRgbStr})`}
                stroke="#1e293b"
                strokeWidth="1.5"
                className="transition-colors duration-700"
              />
              <rect x="28" y="44" width="4" height="14" rx="2" fill="#ffffff" opacity="0.4" />
              <rect x="88" y="44" width="4" height="14" rx="2" fill="#ffffff" opacity="0.4" />
            </g>

            {/* Baby Body */}
            <g
              className={motionState === 'playing' ? 'animate-baby-dance' : ''}
              style={{
                animationDuration: `${danceDuration}s`,
                transformOrigin: '60px 100px',
                transition: motionState !== 'playing' ? 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                transform: motionState !== 'playing' ? 'translateY(0px) rotate(0deg) scale(1)' : undefined,
              }}
            >
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
              <g
                className={motionState === 'playing' ? 'animate-baby-arm-left' : ''}
                style={{
                  animationDuration: `${danceDuration}s`,
                  transformOrigin: '40px 78px',
                  transition: motionState !== 'playing' ? 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  transform: motionState !== 'playing' ? 'rotate(0deg)' : undefined,
                }}
              >
                <path
                  d="M 40 78 Q 28 85 24 95"
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </g>

              {/* Right Arm */}
              <g
                className={motionState === 'playing' ? 'animate-baby-arm-right' : ''}
                style={{
                  animationDuration: `${danceDuration}s`,
                  transformOrigin: '80px 78px',
                  transition: motionState !== 'playing' ? 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  transform: motionState !== 'playing' ? 'rotate(0deg)' : undefined,
                }}
              >
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

        {/* Small Glass Base Pedestal Badge */}
        <div
          className="mt-1 px-3 py-0.5 rounded-full backdrop-blur-md border text-[9px] font-bold tracking-wider uppercase shadow-md text-center transition-all duration-700 pointer-events-none"
          style={{
            borderColor: `rgba(${colorRgbStr}, 0.4)`,
            backgroundColor: `rgba(${colorRgbStr}, 0.2)`,
            color: `rgb(${colorRgbStr})`,
          }}
        >
          {motionState === 'playing'
            ? isBpmDriven
              ? `DANCING (${song.bpm} BPM) ♪`
              : 'DANCING ♪'
            : motionState === 'settling'
            ? 'PAUSED'
            : 'IDLE'}
        </div>

        {/* Subtle Speed Selector Controls (Affects ONLY baby animation speed) */}
        <div className="mt-1.5 flex items-center gap-1 p-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 shadow-lg pointer-events-auto">
          <button
            onClick={() => handleSetSpeed('slow')}
            title="Slow dance tempo"
            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-tight transition cursor-pointer ${
              userSpeed === 'slow' && !isBpmDriven
                ? 'bg-[#FA2D48] text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Slow
          </button>
          <button
            onClick={() => handleSetSpeed('normal')}
            title="Normal dance tempo"
            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-tight transition cursor-pointer ${
              userSpeed === 'normal' || isBpmDriven
                ? 'bg-[#FA2D48] text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => handleSetSpeed('fast')}
            title="Fast dance tempo"
            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-tight transition cursor-pointer ${
              userSpeed === 'fast' && !isBpmDriven
                ? 'bg-[#FA2D48] text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Fast
          </button>
        </div>
      </div>
    </div>
  );
};
