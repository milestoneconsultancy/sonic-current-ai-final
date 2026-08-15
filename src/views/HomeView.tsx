import React, { useEffect, useState } from 'react';
import { Search, Heart, Download, Clock, Play, ChevronRight, Radio, Disc, Sparkles } from 'lucide-react';
import { Song, TabType, RecentlyPlayedItem } from '../types';
import { SongCard } from '../components/SongCard';
import { SongListItem } from '../components/SongListItem';
import { LanguageSelector } from '../components/LanguageSelector';

interface HomeViewProps {
  onTabChange: (tab: TabType) => void;
  recentlyPlayed: RecentlyPlayedItem[];
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  selectedLanguages: string[];
  onLanguageChange: (langs: string[]) => void;
  onPlaySong: (song: Song) => void;
  onPlayAll: (songs: Song[]) => void;
  onToggleFavorite: (song: Song) => void;
  onDownloadSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}

const SPOTLIGHT_BANNERS = [
  {
    kicker: 'FEATURED PLAYLIST',
    title: 'Today’s Top Indian Hits',
    subtitle: 'The hottest tracks across Bollywood, Punjabi pop, and indie charts.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    query: 'top indian hits',
  },
  {
    kicker: 'FREE MUSIC ESSENTIALS',
    title: 'Acoustic Romance & Melodies',
    subtitle: 'Soulful ballads, acoustic gems, and heartfelt melodies for your day.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
    query: 'romantic hindi songs',
  },
  {
    kicker: 'NEW RELEASE RADAR',
    title: 'Punjabi & Dance Anthems',
    subtitle: 'High energy beats, Punjabi rhythms, and chart-topping dance floor essentials.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    query: 'latest punjabi hits',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  onTabChange,
  recentlyPlayed,
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  selectedLanguages,
  onLanguageChange,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
}) => {
  const [globalTrending, setGlobalTrending] = useState<Song[]>([]);
  const [yourTrending, setYourTrending] = useState<Song[]>([]);
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);
  const [aiSections, setAiSections] = useState<
    { title: string; reason: string; songs: Song[] }[]
  >([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState<boolean>(true);
  const [isLoadingPersonal, setIsLoadingPersonal] = useState<boolean>(true);

  // Auto cycle spotlight banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSpotlightIdx((prev) => (prev + 1) % SPOTLIGHT_BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Load AI Personalized Sections
  useEffect(() => {
    let isMounted = true;
    async function loadAIPersonalizedFeed() {
      if (recentlyPlayed.length === 0) return;
      try {
        const historyData = recentlyPlayed.slice(0, 5).map((item) => ({
          title: item.song.title,
          song: item.song.title,
          artist: item.song.artist,
          language: item.song.language,
        }));

        const response = await fetch('/api/personalized-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recentHistory: historyData,
            languages: selectedLanguages,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedSections = data.map((sec: any) => ({
              title: sec.title || 'Made For You',
              reason: sec.reason || '',
              songs: (Array.isArray(sec.songs) ? sec.songs : []).map((s: any) => ({
                id: String(s.id || ''),
                title: String(s.title || s.song || 'Unknown Title'),
                artist: String(s.artist || s.singers || 'Unknown Artist'),
                album: String(s.album || ''),
                duration: String(s.duration || '0'),
                artwork: String(s.artwork || s.image || ''),
                url: String(s.url || s.media_url || ''),
                permaUrl: String(s.perma_url || ''),
                whyPicked: s.whyPicked,
              })),
            }));
            if (isMounted) setAiSections(mappedSections);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch AI personalized feed:', err);
      }
    }

    loadAIPersonalizedFeed();
    return () => {
      isMounted = false;
    };
  }, [recentlyPlayed.length, selectedLanguages]);

  // Load Global Trending
  useEffect(() => {
    let isMounted = true;
    async function loadGlobalTrending() {
      setIsLoadingGlobal(true);
      try {
        const langs = selectedLanguages.join(',');
        const response = await fetch(`/api/trending?languages=${encodeURIComponent(langs)}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Song[] = data.map((item: any) => ({
              id: String(item.id || ''),
              title: String(item.title || item.song || 'Unknown Title'),
              artist: String(item.artist || item.singers || 'Unknown Artist'),
              album: String(item.album || ''),
              duration: String(item.duration || '0'),
              artwork: String(item.artwork || item.image || ''),
              url: String(item.url || item.media_url || ''),
              permaUrl: String(item.perma_url || ''),
            }));
            if (isMounted) setGlobalTrending(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load global trending songs:', err);
      } finally {
        if (isMounted) setIsLoadingGlobal(false);
      }
    }
    loadGlobalTrending();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguages]);

  // Load Personalized Trending
  useEffect(() => {
    let isMounted = true;
    async function loadYourTrending() {
      setIsLoadingPersonal(true);
      try {
        let langPrefix = selectedLanguages.includes('All Indian Languages')
          ? 'latest indian hits'
          : selectedLanguages.slice(0, 2).join(' ') + ' trending hits';

        if (recentlyPlayed.length > 0) {
          const topArtist = recentlyPlayed[0]?.song?.artist || '';
          if (topArtist) {
            langPrefix = `${topArtist} ${selectedLanguages.includes('All Indian Languages') ? '' : selectedLanguages[0] || ''} hits`;
          }
        }

        const response = await fetch(`/api/search?query=${encodeURIComponent(langPrefix)}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Song[] = data.map((item: any) => ({
              id: String(item.id || ''),
              title: String(item.title || item.song || 'Unknown Title'),
              artist: String(item.artist || item.singers || 'Unknown Artist'),
              album: String(item.album || ''),
              duration: String(item.duration || '0'),
              artwork: String(item.artwork || item.image || ''),
              url: String(item.url || item.media_url || ''),
              permaUrl: String(item.perma_url || ''),
            }));
            if (isMounted) setYourTrending(mapped.slice(0, 10));
          }
        }
      } catch (err) {
        console.error('Failed to load personalized trending:', err);
      } finally {
        if (isMounted) setIsLoadingPersonal(false);
      }
    }
    loadYourTrending();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguages, recentlyPlayed.length]);

  const activeSpotlight = SPOTLIGHT_BANNERS[activeSpotlightIdx];

  const handleSpotlightPlay = async () => {
    if (yourTrending.length > 0) {
      onPlayAll(yourTrending);
    } else if (globalTrending.length > 0) {
      onPlayAll(globalTrending);
    } else {
      onTabChange('search');
    }
  };

  return (
    <div className="space-y-9 pb-28 animate-in fade-in duration-200">
      {/* 1. iOS Large Title Header with Language Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#C6C6C8]/40 dark:border-[#38383A]/60">
        <div>
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-0.5">
            Free Music • High Quality Audio
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white">
            Listen Now
          </h1>
        </div>

        <div className="shrink-0">
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onChange={onLanguageChange}
          />
        </div>
      </div>

      {/* 2. Featured Spotlight Hero (Signature 12pt Radius, Apple Music Red) */}
      <div className="relative rounded-[16px] overflow-hidden shadow-md bg-black text-white group">
        <div className="relative aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] min-h-[220px] sm:min-h-[250px] w-full flex items-end p-6 sm:p-8">
          <img
            src={activeSpotlight.image}
            alt={activeSpotlight.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-all duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Hero Details */}
          <div className="relative z-10 space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold tracking-wider text-[#FA2D48] bg-white/90 dark:bg-black/80 px-2.5 py-0.5 rounded-full uppercase inline-block">
              {activeSpotlight.kicker}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              {activeSpotlight.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 font-normal max-w-lg">
              {activeSpotlight.subtitle}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSpotlightPlay}
                className="px-5 py-2.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs tracking-wide shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play</span>
              </button>

              <button
                onClick={() => onTabChange('instantmix')}
                className="px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium text-xs backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Instant Mix</span>
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full">
            {SPOTLIGHT_BANNERS.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setActiveSpotlightIdx(dotIdx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  dotIdx === activeSpotlightIdx ? 'w-4 bg-[#FA2D48]' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Quick Navigation Tiles (iOS Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onTabChange('search')}
          className="group p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] cursor-pointer transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-black dark:text-white truncate">Search</h3>
            <p className="text-xs text-[#8E8E93] truncate">Find songs & artists</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('instantmix')}
          className="group p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] cursor-pointer transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-black dark:text-white truncate">Instant Mix</h3>
            <p className="text-xs text-[#8E8E93] truncate">Dynamic station</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('favorites')}
          className="group p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] cursor-pointer transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-black dark:text-white truncate">Favorites</h3>
            <p className="text-xs text-[#8E8E93] truncate">{favoritesSet.size} tracks</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('downloads')}
          className="group p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] cursor-pointer transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-black dark:text-white truncate">Downloaded</h3>
            <p className="text-xs text-[#8E8E93] truncate">{downloadedSet.size} offline</p>
          </div>
        </div>
      </div>

      {/* 4. MADE FOR YOU (PERSONALIZED) SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
              Made For You
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Personalized hits in {selectedLanguages.join(', ')}
            </p>
          </div>

          {yourTrending.length > 0 && (
            <button
              onClick={() => onPlayAll(yourTrending)}
              className="px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingPersonal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="space-y-2 animate-pulse">
                <div className="aspect-square bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px]" />
                <div className="h-3.5 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded w-3/4" />
                <div className="h-3 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : yourTrending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {yourTrending.map((song) => (
              <SongCard
                key={'yt_' + song.id}
                song={song}
                isPlaying={isPlaying}
                isCurrent={currentSong?.id === song.id}
                isFavorite={favoritesSet.has(song.id)}
                isDownloaded={downloadedSet.has(song.id)}
                isDownloading={downloadingSet.has(song.id)}
                onPlay={onPlaySong}
                onToggleFavorite={onToggleFavorite}
                onDownload={onDownloadSong}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[12px] text-[#8E8E93] text-xs">
            Select your favorite languages above to get personalized recommendations!
          </div>
        )}
      </div>

      {/* 6. AI PERSONALIZED MIX SECTIONS */}
      {aiSections.map((sec, secIdx) => (
        <div key={`ai_sec_${secIdx}`} className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
                {sec.title}
              </h2>
              <p className="text-xs text-[#8E8E93]">
                {sec.reason || 'Curated for you'}
              </p>
            </div>

            {sec.songs.length > 0 && (
              <button
                onClick={() => onPlayAll(sec.songs)}
                className="px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Play All</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {sec.songs.map((song) => (
              <SongCard
                key={'ai_song_' + song.id}
                song={song}
                isPlaying={isPlaying}
                isCurrent={currentSong?.id === song.id}
                isFavorite={favoritesSet.has(song.id)}
                isDownloaded={downloadedSet.has(song.id)}
                isDownloading={downloadingSet.has(song.id)}
                onPlay={onPlaySong}
                onToggleFavorite={onToggleFavorite}
                onDownload={onDownloadSong}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 7. TOP CHARTS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
              Top Charts
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Daily Top 100 • High stream velocity across India
            </p>
          </div>

          {globalTrending.length > 0 && (
            <button
              onClick={() => onPlayAll(globalTrending)}
              className="px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingGlobal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="space-y-2 animate-pulse">
                <div className="aspect-square bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px]" />
                <div className="h-3.5 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded w-3/4" />
                <div className="h-3 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : globalTrending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {globalTrending.map((song) => (
              <SongCard
                key={'gt_' + song.id}
                song={song}
                isPlaying={isPlaying}
                isCurrent={currentSong?.id === song.id}
                isFavorite={favoritesSet.has(song.id)}
                isDownloaded={downloadedSet.has(song.id)}
                isDownloading={downloadingSet.has(song.id)}
                onPlay={onPlaySong}
                onToggleFavorite={onToggleFavorite}
                onDownload={onDownloadSong}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[12px] text-[#8E8E93] text-xs">
            Unable to load top charts. Try searching directly!
          </div>
        )}
      </div>

      {/* 8. RECENTLY PLAYED SECTION (56px Row format) */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
            <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FA2D48]" /> Recently Played
            </h3>
            <button
              onClick={() => onTabChange('history')}
              className="text-xs font-semibold text-[#FA2D48] hover:underline transition cursor-pointer"
            >
              See All ({recentlyPlayed.length})
            </button>
          </div>

          <div className="space-y-1">
            {recentlyPlayed.slice(0, 5).map((item) => (
              <SongListItem
                key={item.id}
                song={item.song}
                isPlaying={isPlaying}
                isCurrent={currentSong?.id === item.song.id}
                isFavorite={favoritesSet.has(item.song.id)}
                isDownloaded={downloadedSet.has(item.song.id)}
                isDownloading={downloadingSet.has(item.song.id)}
                onPlay={onPlaySong}
                onToggleFavorite={onToggleFavorite}
                onDownload={onDownloadSong}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
