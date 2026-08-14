import React from 'react';
import { Compass, Search, Download, LayoutDashboard, Music2, Sparkles, History, Heart, WifiOff } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  favoritesCount: number;
  downloadsCount: number;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
  downloadsCount,
  isAdmin = false,
}) => {
  const mainNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | null; badgeColor?: string }[] = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'downloads', label: 'Offline Deck', icon: Download, badge: downloadsCount > 0 ? downloadsCount : null, badgeColor: 'bg-emerald-500 text-slate-950' },
  ];

  if (isAdmin) {
    mainNav.push({ id: 'dashboard', label: 'Admin Portal', icon: LayoutDashboard });
  }

  const libraryNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | null }[] = [
    { id: 'favorites', label: 'Liked Tracks', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'history', label: 'Recent Plays', icon: History },
  ];

  const isOffline = !navigator.onLine;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 backdrop-blur-3xl h-screen sticky top-0 shrink-0 select-none z-30 shadow-xs transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div
          className="flex items-center gap-3.5 cursor-pointer group"
          onClick={() => onTabChange('home')}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <Music2 className="w-6 h-6 fill-current text-slate-950" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tighter text-slate-900 dark:text-white leading-none">
              FREE MUSIC
            </h1>
            <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-widest uppercase mt-1">
              BY SURAJ KHANDAGALE
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-4 py-5 space-y-6 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Browse
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Library Section */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Collection
          </div>
          {libraryNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Flight Mode Callout if Offline */}
        {isOffline && (
          <div
            onClick={() => onTabChange('downloads')}
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 cursor-pointer hover:bg-rose-500/15 transition shadow-xs"
          >
            <div className="flex items-center gap-2 text-xs font-black text-rose-600 dark:text-rose-400">
              <WifiOff className="w-4 h-4" />
              <span>Flight Mode Active</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              Access your {downloadsCount} offline tracks in the Offline Deck.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Audio Engine Card */}
      <div className="mx-4 my-4 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-1">
        <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>HD Lossless Engine</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">
          Instant IndexedDB caching with 320kbps full stream fidelity.
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 text-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">
          FREE MUSIC • V3.2
        </span>
      </div>
    </aside>
  );
};
