import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic2,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Music2,
  Volume2,
} from 'lucide-react';
import { Song, LyricsData, LyricLine } from '../types';

interface LyricsViewProps {
  song: Song;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onClose?: () => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  song,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onClose,
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'synced' | 'plain'>('synced');
  const [copied, setCopied] = useState<boolean>(false);
  const [userScrolled, setUserScrolled] = useState<boolean>(false);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const userScrollTimeoutRef = useRef<number | null>(null);

  // Fetch lyrics whenever song.id or song.title changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setLyricsData(null);
    setUserScrolled(false);

    const fetchLyrics = async () => {
      try {
        const cleanTitle = song.title.replace(/\(From "[^"]+"\)/gi, '').trim();
        const cleanArtist = song.artist.split(',')[0].trim();
        const durSec = parseFloat(song.duration) || duration || 0;

        const params = new URLSearchParams();
        if (song.id) params.append('id', song.id);
        if (cleanTitle) params.append('title', cleanTitle);
        if (cleanArtist) params.append('artist', cleanArtist);
        if (song.album) params.append('album', song.album);
        if (durSec > 0) params.append('duration', durSec.toString());

        const res = await fetch(`/api/lyrics?${params.toString()}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Lyrics not available for this track yet.');
          }
          throw new Error(`Failed to load lyrics (${res.status})`);
        }

        const data: LyricsData = await res.json();
        if (isMounted) {
          setLyricsData(data);
          // Set default view mode based on whether synced lyrics are available
          if (data.syncedLyrics && data.syncedLyrics.length > 0) {
            setViewMode('synced');
          } else {
            setViewMode('plain');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[LyricsView error]:', err?.message || err);
          setError(err?.message || 'Unable to fetch lyrics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      isMounted = false;
    };
  }, [song.id, song.title, song.artist, song.album]);

  // Find the index of currently active synced lyric line
  const activeLineIndex = useMemo(() => {
    if (!lyricsData?.syncedLyrics || lyricsData.syncedLyrics.length === 0) {
      return -1;
    }

    const lines = lyricsData.syncedLyrics;
    // Find the last line whose timestamp is <= currentTime + 0.3s (anticipation offset)
    const effectiveTime = currentTime + 0.25;
    let activeIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= effectiveTime) {
        activeIdx = i;
      } else {
        break;
      }
    }

    return activeIdx;
  }, [lyricsData?.syncedLyrics, currentTime]);

  // Auto-scroll the active line into center when playing and not manually overridden
  useEffect(() => {
    if (viewMode !== 'synced' || userScrolled || activeLineIndex < 0) return;

    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, viewMode, userScrolled]);

  // Handle user manual scroll interaction
  const handleScroll = () => {
    setUserScrolled(true);
    if (userScrollTimeoutRef.current) {
      window.clearTimeout(userScrollTimeoutRef.current);
    }
    // Automatically re-engage auto-scroll after 4 seconds of idle
    userScrollTimeoutRef.current = window.setTimeout(() => {
      setUserScrolled(false);
    }, 4000);
  };

  const handleResumeAutoScroll = () => {
    setUserScrolled(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleCopyLyrics = async () => {
    if (!lyricsData?.lyrics) return;
    try {
      await navigator.clipboard.writeText(lyricsData.lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto rounded-[24px] bg-[#1C1C1E]/70 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-300">
      {/* Top Header & Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#FA2D48]/20 border border-[#FA2D48]/30 flex items-center justify-center text-[#FA2D48] shrink-0">
            <Mic2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white uppercase truncate">
                Time-Synced Lyrics
              </span>
              {lyricsData?.isSynced && (
                <span className="px-2 py-0.5 rounded-full bg-[#34C759]/20 border border-[#34C759]/40 text-[#34C759] text-[9px] font-bold uppercase tracking-wider shrink-0">
                  Synced
                </span>
              )}
            </div>
            {lyricsData?.source && (
              <p className="text-[10px] text-[#8E8E93] truncate mt-0.5">
                Source: {lyricsData.source}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Synced vs Plain Toggle */}
          {lyricsData?.syncedLyrics && lyricsData.syncedLyrics.length > 0 && (
            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/10 text-[11px] font-semibold">
              <button
                onClick={() => setViewMode('synced')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  viewMode === 'synced'
                    ? 'bg-[#FA2D48] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Synchronized Lyrics"
              >
                Synced
              </button>
              <button
                onClick={() => setViewMode('plain')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  viewMode === 'plain'
                    ? 'bg-[#FA2D48] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Full Plain Lyrics"
              >
                Full Text
              </button>
            </div>
          )}

          {/* Copy Button */}
          {lyricsData?.lyrics && (
            <button
              onClick={handleCopyLyrics}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 transition cursor-pointer"
              title="Copy Lyrics to Clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#34C759]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Lyrics Body */}
      <div
        ref={lyricsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-4 text-center select-text scroll-smooth relative"
        style={{ minHeight: '260px', maxHeight: '380px' }}
      >
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-[#8E8E93] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FA2D48]" />
            <p className="text-sm font-semibold text-white animate-pulse">
              Fetching lyrics for "{song.title}"...
            </p>
            <span className="text-xs text-[#8E8E93]">
              Synchronizing with music catalog
            </span>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-[#8E8E93] space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{error}</p>
              <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
                Lyrics might be instrumental or under copyright.
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                const cleanTitle = song.title.replace(/\(From "[^"]+"\)/gi, '').trim();
                fetch(`/api/lyrics?id=${song.id}&title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(song.artist)}`)
                  .then((r) => r.json())
                  .then((d) => {
                    setLyricsData(d);
                    setLoading(false);
                  })
                  .catch((e) => {
                    setError(e.message || 'Retry failed');
                    setLoading(false);
                  });
              }}
              className="px-4 py-2 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Fetch</span>
            </button>
          </div>
        )}

        {/* Synced Lyrics Mode */}
        {!loading && !error && viewMode === 'synced' && lyricsData?.syncedLyrics && lyricsData.syncedLyrics.length > 0 && (
          <div className="space-y-3 py-6">
            {lyricsData.syncedLyrics.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isPast = activeLineIndex > -1 && idx < activeLineIndex;
              const isFuture = activeLineIndex > -1 && idx > activeLineIndex;

              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.time)}
                  className={`group relative py-2.5 px-4 rounded-[16px] transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[#FA2D48]/20 border border-[#FA2D48]/40 text-white font-extrabold text-lg sm:text-xl md:text-2xl scale-105 shadow-lg shadow-[#FA2D48]/10'
                      : isPast
                      ? 'text-[#8E8E93] font-semibold text-sm sm:text-base opacity-60 hover:opacity-100 hover:text-white'
                      : 'text-[#EBEBF5]/60 font-medium text-sm sm:text-base opacity-70 hover:opacity-100 hover:text-white'
                  }`}
                >
                  <p className="tracking-tight leading-relaxed">{line.text || '♪ ♪ ♪'}</p>

                  {/* Hover Timestamp Indicator */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] font-mono text-white/90 bg-black/80 px-2 py-0.5 rounded-full border border-white/10">
                    {Math.floor(line.time / 60)}:
                    {Math.floor(line.time % 60)
                      .toString()
                      .padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Plain Text Lyrics Mode */}
        {!loading && !error && (viewMode === 'plain' || !lyricsData?.syncedLyrics || lyricsData.syncedLyrics.length === 0) && lyricsData?.lyrics && (
          <div className="space-y-4 py-4 text-left max-w-lg mx-auto">
            {lyricsData.lyrics.split('\n\n').map((stanza, sIdx) => (
              <div
                key={sIdx}
                className="p-4 rounded-[16px] bg-white/5 border border-white/5 hover:border-white/10 transition"
              >
                {stanza.split('\n').map((line, lIdx) => (
                  <p
                    key={lIdx}
                    className="text-sm sm:text-base font-medium text-white/90 leading-relaxed tracking-tight"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Copyright notice if present */}
        {lyricsData?.copyright && (
          <p className="text-[10px] text-[#8E8E93] pt-6 pb-2 border-t border-white/10 max-w-md mx-auto text-center">
            {lyricsData.copyright}
          </p>
        )}
      </div>

      {/* Floating "Resume Auto-scroll" Pill if user scrolled away */}
      {userScrolled && viewMode === 'synced' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={handleResumeAutoScroll}
            className="px-4 py-2 rounded-full bg-[#FA2D48] text-white font-semibold text-xs shadow-xl flex items-center gap-1.5 hover:bg-[#FC3C44] transition cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Sync to Current Position</span>
          </button>
        </div>
      )}
    </div>
  );
};
