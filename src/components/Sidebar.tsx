import React from 'react';
import { Home, Search, Download, LayoutDashboard, Music2, Sparkles, Clock, Heart } from 'lucide-react';
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
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'downloads', label: 'Offline', icon: Download, badge: downloadsCount > 0 ? downloadsCount : null },
  ];

  if (isAdmin) {
    mainNav.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  const quickNav: { id: TabType; label: string; icon: React.ElementType; badge?: number | null }[] = [
    { id: 'history', label: 'History', icon: Clock },
    { id: 'favorites', label: 'Liked Songs', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : null },
  ];

  return (
    <aside className="hidden md:flex flex-col w-70 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl h-screen sticky top-0 shrink-0 select-none z-30 shadow-sm transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onTabChange('home')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Music2 className="w-6 h-6 fill-current text-slate-950" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              FREE MUSIC
            </h1>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase mt-1">
              SURAJ KHANDAGALE
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="px-4 py-5 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Menu
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-slate-950 text-amber-400 font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Library
        </div>
        {quickNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-slate-800 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quality Badge */}
      <div className="mx-4 my-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>320kbps Audio Quality</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
          Full length audio stream & offline cache active.
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
          FREE MUSIC
        </span>
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">
          SURAJ KHANDAGALE
        </p>
      </div>
    </aside>
  );
};
