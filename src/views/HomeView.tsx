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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
              Free Music Stream
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Discover Unlimited Music
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Select your preferred languages to personalize your home stream
          </p>
        </div>

        <LanguageSelector
          selectedLanguages={selectedLanguages}
          onChange={onLanguageChange}
        />
      </div>

      {/* Quick Discovery Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => onTabChange('search')}
          className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">Search Library</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Explore songs & artists</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('favorites')}
          className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition">Liked Songs</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{favoritesSet.size} tracks</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('downloads')}
          className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">Offline Library</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{downloadedSet.size} offline</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('history')}
          className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-200 transition">History</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{recentlyPlayed.length} recent</p>
          </div>
        </div>
      </div>

      {/* YOUR TRENDING (PERSONALIZED) SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shadow-xs border border-amber-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-2">
                <span>YOUR TRENDING</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              </h2>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-0.5">
                Personalized Hits ({selectedLanguages.join(', ')})
              </p>
            </div>
          </div>

          {yourTrending.length > 0 && (
            <button
              onClick={() => onPlayAll(yourTrending)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingPersonal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : yourTrending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-slate-500 text-xs font-semibold">
            Select your favorite languages above to get personalized recommendations!
          </div>
        )}
      </div>

      {/* AI PERSONALIZED MIX SECTIONS */}
      {aiSections.map((sec, secIdx) => (
        <div key={`ai_sec_${secIdx}`} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold shadow-xs border border-purple-500/30">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-2">
                  <span>{sec.title}</span>
                </h2>
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mt-0.5">
                  {sec.reason || 'AI Smart Recommendation'}
                </p>
              </div>
            </div>

            {sec.songs.length > 0 && (
              <button
                onClick={() => onPlayAll(sec.songs)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Mix</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                GLOBAL TRENDING
              </h2>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-0.5">
                App-Wide Chart Hits
              </p>
            </div>
          </div>

          {globalTrending.length > 0 && (
            <button
              onClick={() => onPlayAll(globalTrending)}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-400 dark:text-slate-950" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingGlobal ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : globalTrending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-slate-500 text-xs">
            Unable to load global trending songs. Try searching directly!
          </div>
        )}
      </div>

      {/* RECENTLY PLAYED SECTION */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/90 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Continue Listening
            </h3>
            <button
              onClick={() => onTabChange('history')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 transition cursor-pointer"
            >
              View History ({recentlyPlayed.length})
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
