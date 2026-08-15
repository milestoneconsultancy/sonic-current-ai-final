import React from 'react';
import {
  Compass,
  Search,
  Download,
  LayoutDashboard,
  Sparkles,
  History,
  Heart,
  WifiOff,
  Radio,
  Music2,
  ListMusic,
} from 'lucide-react';
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
  const mainNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | string | null }[] = [
    { id: 'home', label: 'Listen Now', icon: Compass },
    { id: 'instantmix', label: 'Radio & Mixes', icon: Radio },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'dashboard', label: 'Admin Portal', icon: LayoutDashboard, badge: isAdmin ? 'Live' : null },
  ];

  const libraryNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | null }[] = [
    { id: 'favorites', label: 'Favorite Songs', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'downloads', label: 'Downloaded Music', icon: Download, badge: downloadsCount > 0 ? downloadsCount : null },
    { id: 'history', label: 'Recently Played', icon: History },
  ];

  const isOffline = !navigator.onLine;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#C6C6C8]/40 dark:border-[#38383A]/50 bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white h-screen sticky top-0 shrink-0 select-none z-30 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onTabChange('home')}
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#FA2D48] flex items-center justify-center text-white shadow-sm group-hover:bg-[#FC3C44] transition-all duration-200">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-lg tracking-tight text-black dark:text-white leading-none">
              Free Music
            </h1>
            <p className="text-[11px] font-normal text-[#8E8E93] mt-1 truncate">
              Designed by Suraj Khandagale
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-3 py-4 space-y-6 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#8E8E93] tracking-wide uppercase">
            Browse
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
                    : 'text-black/80 dark:text-white/80 hover:bg-[#E5E5EA] dark:hover:bg-[#1C1C1E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isActive ? 'text-white stroke-[2.4]' : 'text-[#FA2D48] dark:text-[#FA2D48] stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93]'
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
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#8E8E93] tracking-wide uppercase">
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
                    : 'text-black/80 dark:text-white/80 hover:bg-[#E5E5EA] dark:hover:bg-[#1C1C1E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isActive ? 'text-white stroke-[2.4]' : 'text-[#FA2D48] dark:text-[#FA2D48] stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Offline Callout */}
        {isOffline && (
          <div
            onClick={() => onTabChange('downloads')}
            className="p-3.5 rounded-[12px] bg-[#FF9500]/10 border border-[#FF9500]/30 space-y-1 cursor-pointer hover:bg-[#FF9500]/15 transition"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FF9500]">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode Active</span>
            </div>
            <p className="text-[11px] text-black/70 dark:text-white/70 leading-snug">
              Access your {downloadsCount} downloaded songs in your offline library.
            </p>
          </div>
        )}
      </div>

      {/* Footer Credit */}
      <div className="p-4 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50 text-center">
        <span className="text-[11px] font-medium text-[#8E8E93]">
          Free Music • Designed by Suraj Khandagale
        </span>
      </div>
    </aside>
  );
};
