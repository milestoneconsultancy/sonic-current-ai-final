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
  const mainNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | null }[] = [
    { id: 'home', label: 'Listen Now', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'downloads', label: 'Library', icon: Download, badge: downloadsCount > 0 ? downloadsCount : null },
  ];

  if (isAdmin) {
    mainNav.push({ id: 'dashboard', label: 'Admin Portal', icon: LayoutDashboard });
  }

  const libraryNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | null }[] = [
    { id: 'favorites', label: 'Liked Tracks', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'history', label: 'Recently Played', icon: History },
  ];

  const isOffline = !navigator.onLine;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#C6C6C8]/40 dark:border-[#38383A]/60 bg-[#F2F2F7]/90 dark:bg-[#000000] backdrop-blur-3xl h-screen sticky top-0 shrink-0 select-none z-30 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onTabChange('home')}
        >
          <div className="w-10 h-10 rounded-[11px] bg-gradient-to-tr from-[#FA2D48] to-[#FC3C44] flex items-center justify-center text-white shadow-md shadow-[#FA2D48]/25 group-hover:scale-105 transition-transform">
            <Music2 className="w-5 h-5 fill-current text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-tight text-black dark:text-white leading-none">
              Music
            </h1>
            <p className="text-[10px] font-semibold text-[#FA2D48] tracking-wider uppercase mt-1">
              FREE MUSIC
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-3 py-4 space-y-6 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-0.5">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 uppercase">
            Apple Music
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-sm font-medium transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-[#FA2D48] text-white font-semibold shadow-xs'
                    : 'text-[#1C1C1E] dark:text-[#E5E5EA] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isActive ? 'text-white stroke-[2.2]' : 'text-[#FA2D48] stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#3C3C43] dark:text-[#EBEBF5]'
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
        <div className="space-y-0.5">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 uppercase">
            Library
          </div>
          {libraryNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-sm font-medium transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-[#FA2D48] text-white font-semibold shadow-xs'
                    : 'text-[#1C1C1E] dark:text-[#E5E5EA] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isActive ? 'text-white stroke-[2.2]' : 'text-[#FA2D48] stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#3C3C43] dark:text-[#EBEBF5]'
                    }`}
                  >
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
            className="p-3.5 rounded-[12px] bg-[#FA2D48]/10 border border-[#FA2D48]/30 space-y-1 cursor-pointer hover:bg-[#FA2D48]/15 transition"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA2D48]">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode</span>
            </div>
            <p className="text-[12px] text-[#3C3C43] dark:text-[#EBEBF5]/80 leading-snug">
              Access your {downloadsCount} offline tracks in Library.
            </p>
          </div>
        )}
      </div>

      {/* Audio Engine Quality Badge Card */}
      <div className="mx-3 my-3 p-3 rounded-[12px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 space-y-1 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D4A857]">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Lossless & Spatial Audio</span>
        </div>
        <p className="text-[11px] text-[#3C3C43]/70 dark:text-[#8E8E93] leading-snug">
          High-resolution 24-bit / 48kHz audio streaming with instant offline caching.
        </p>
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50 text-center">
        <span className="text-[10px] font-medium text-[#3C3C43]/50 dark:text-[#8E8E93]/60 tracking-wider uppercase">
          Apple Music Design • Free Stream
        </span>
      </div>
    </aside>
  );
};

