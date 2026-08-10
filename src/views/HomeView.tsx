import React from 'react';
import { Search, Heart, Download, Clock, Music, Sparkles, Play, Compass } from 'lucide-react';
import { Song, TabType, RecentlyPlayedItem } from '../types';
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
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
}) => {
  const hasUserActivity = recentlyPlayed.length > 0 || favoritesSet.size > 0 || downloadedSet.size > 0;

  return (
    <div className="space-y-8 pb-24">
      {/* Brand Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-8 md:p-12 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Premium Music Experience
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
              SONIC CURRENT
            </h1>
            <p className="text-xs sm:text-sm font-black text-amber-600 uppercase tracking-widest pt-1">
              SURAJ KHANDAGALE
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-xl">
            Stream high-fidelity music, search millions of tracks, build your queue, and save your favorites for offline playback.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onTabChange('search')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 hover:scale-102 transition flex items-center gap-2.5"
            >
              <Search className="w-4 h-4 text-amber-400" /> Search Songs & Artists
            </button>
            <button
              onClick={() => onTabChange('favorites')}
              className="px-5 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-200/80 transition flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-current" /> Liked Favorites ({favoritesSet.size})
            </button>
          </div>
        </div>
      </div>

      {/* Primary Discovery Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onTabChange('search')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2.5 shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition">Search Library</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Find music instantly</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('favorites')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2.5 shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition">Liked Favorites</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{favoritesSet.size} tracks saved</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('downloads')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2.5 shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">Offline Library</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{downloadedSet.size} tracks offline</p>
          </div>
        </div>

        <div
          onClick={() => onTabChange('history')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all duration-200 space-y-2.5 shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-800 transition">History</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{recentlyPlayed.length} recently played</p>
          </div>
        </div>
      </div>

      {/* Continue Listening / Recently Played Section (Real Data Only) */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
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

      {/* Clean Welcome State if No User Activity Yet */}
      {!hasUserActivity && (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/90 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Start Your Musical Journey</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
              Use the search bar above to search for your favorite songs, artists, or genres. Your recently played tracks and favorites will appear here automatically.
            </p>
          </div>
          <button
            onClick={() => onTabChange('search')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-amber-400" /> Start Searching
          </button>
        </div>
      )}
    </div>
  );
};

