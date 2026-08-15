import React, { useEffect, useState } from 'react';
import { Search, Heart, Download, Clock, Play, Flame, Sparkles, UserCheck } from 'lucide-react';
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
  const [aiSections, setAiSections] = useState<
    { title: string; reason: string; songs: Song[] }[]
  >([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState<boolean>(true);
  const [isLoadingPersonal, setIsLoadingPersonal] = useState<boolean>(true);

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
              title: sec.title || 'Recommended For You',
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

  // Load Your Trending (Personalized to User & Language Preferences)
  useEffect(() => {
    let isMounted = true;
    async function loadYourTrending() {
      setIsLoadingPersonal(true);
      try {
        // Construct targeted query from user's history and selected languages
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

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-300">
      {/* Top Banner & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 rounded-[20px] p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-[10px] font-bold uppercase tracking-wider">
              Listen Now
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight">
            Discover Music
          </h1>
          <p className="text-xs font-normal text-[#3C3C43]/70 dark:text-[#8E8E93]">
            Select your preferred languages to personalize your daily recommendations
          </p>
        </div>

        <LanguageSelector
          selectedLanguages={selectedLanguages}
          onChange={onLanguageChange}
        />
      </div>

      {/* Quick Discovery Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => onTabChange('search')}
          className="group p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#FA2D48] dark:hover:border-[#FA2D48] cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-black dark:text-white group-hover:text-[#FA2D48] transition">Search Library</h3>
            <p className="text-[11px] text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal mt-0.5">Explore songs & artists</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('favorites')}
          className="group p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#FA2D48] dark:hover:border-[#FA2D48] cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-black dark:text-white group-hover:text-[#FA2D48] transition">Favorite Songs</h3>
            <p className="text-[11px] text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal mt-0.5">{favoritesSet.size} tracks</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('downloads')}
          className="group p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#34C759] dark:hover:border-[#34C759] cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-black dark:text-white group-hover:text-[#34C759] transition">Downloaded</h3>
            <p className="text-[11px] text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal mt-0.5">{downloadedSet.size} offline</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('history')}
          className="group p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#007AFF] dark:hover:border-[#0A84FF] cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-black dark:text-white group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition">Recently Played</h3>
            <p className="text-[11px] text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal mt-0.5">{recentlyPlayed.length} recent</p>
          </div>
        </div>
      </div>

      {/* YOUR TRENDING (PERSONALIZED) SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight leading-none flex items-center gap-2">
                <span>Made For You</span>
                <Sparkles className="w-4 h-4 text-[#FA2D48]" />
              </h2>
              <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] mt-1">
                Personalized Hits • {selectedLanguages.join(', ')}
              </p>
            </div>
          </div>

          {yourTrending.length > 0 && (
            <button
              onClick={() => onPlayAll(yourTrending)}
              className="px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingPersonal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-3 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 animate-pulse space-y-2.5">
                <div className="aspect-square bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px]" />
                <div className="h-4 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-md w-3/4" />
                <div className="h-3 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-md w-1/2" />
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
          <div className="p-6 text-center bg-[#FFFFFF] dark:bg-[#1C1C1E] rounded-[16px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-[#8E8E93] text-xs">
            Select your favorite languages above to get personalized recommendations!
          </div>
        )}
      </div>

      {/* AI PERSONALIZED MIX SECTIONS */}
      {aiSections.map((sec, secIdx) => (
        <div key={`ai_sec_${secIdx}`} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight leading-none flex items-center gap-2">
                <span>{sec.title}</span>
              </h2>
              <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] mt-1">
                {sec.reason || 'Curated Station'}
              </p>
            </div>

            {sec.songs.length > 0 && (
              <button
                onClick={() => onPlayAll(sec.songs)}
                className="px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Station</span>
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

      {/* GLOBAL TRENDING SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight leading-none flex items-center gap-2">
              <span>Top Charts</span>
              <Flame className="w-4 h-4 text-[#FF9500]" />
            </h2>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] mt-1">
              Top songs across all charts
            </p>
          </div>

          {globalTrending.length > 0 && (
            <button
              onClick={() => onPlayAll(globalTrending)}
              className="px-3.5 py-1.5 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingGlobal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="p-3 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 animate-pulse space-y-2.5">
                <div className="aspect-square bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px]" />
                <div className="h-4 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-md w-3/4" />
                <div className="h-3 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-md w-1/2" />
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
          <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#1C1C1E] rounded-[16px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-[#8E8E93] text-xs">
            Unable to load top charts. Try searching directly!
          </div>
        )}
      </div>

      {/* RECENTLY PLAYED SECTION */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
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

          <div className="space-y-2">
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
