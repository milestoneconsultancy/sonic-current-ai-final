import React, { useEffect, useState } from 'react';
import { Search, Heart, Download, Clock, Sparkles, Play, Flame } from 'lucide-react';
import { Song, TabType, RecentlyPlayedItem } from '../types';
import { SongCard } from '../components/SongCard';
import { SongListItem } from '../components/SongListItem';

interface HomeViewProps {
  onTabChange: (tab: TabType) => void;
  recentlyPlayed: RecentlyPlayedItem[];
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
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
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
}) => {
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      try {
        const response = await fetch('/api/trending');
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
            if (isMounted) {
              setTrendingSongs(mapped);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load trending songs:', err);
      } finally {
        if (isMounted) setIsLoadingTrending(false);
      }
    }
    loadTrending();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 pb-24">
      {/* Quick Discovery Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => onTabChange('search')}
          className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition">Search Library</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Explore songs & artists</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('favorites')}
          className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 group-hover:text-rose-600 transition">Liked Songs</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{favoritesSet.size} tracks</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('downloads')}
          className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">Offline Library</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{downloadedSet.size} offline</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('history')}
          className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2 shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 group-hover:text-slate-800 transition">History</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{recentlyPlayed.length} recent</p>
          </div>
        </div>
      </div>

      {/* TRENDING SONGS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                TRENDING NOW
              </h2>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">
                Top Charting Hits
              </p>
            </div>
          </div>

          {trendingSongs.length > 0 && (
            <button
              onClick={() => onPlayAll(trendingSongs)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {isLoadingTrending ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 animate-pulse space-y-3">
                <div className="aspect-square bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : trendingSongs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingSongs.map((song) => (
              <SongCard
                key={song.id}
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
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500 text-xs">
            Unable to load trending songs. Try searching directly!
          </div>
        )}
      </div>

      {/* RECENTLY PLAYED SECTION */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/90">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" /> Continue Listening
            </h3>
            <button
              onClick={() => onTabChange('history')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 transition"
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
