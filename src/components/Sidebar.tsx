import React from 'react';
import { Home, Search, Clock, Heart, Download, Music2, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  favoritesCount: number;
  downloadsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
  downloadsCount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: number | null }[] = [
    { id: 'home', label: 'Home', icon: Home, badge: null },
    { id: 'search', label: 'Search', icon: Search, badge: null },
    { id: 'history', label: 'History', icon: Clock, badge: null },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'downloads', label: 'Downloads', icon: Download, badge: downloadsCount > 0 ? downloadsCount : null },
  ];

  return (
    <aside className="hidden md:flex flex-col w-70 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl h-screen sticky top-0 shrink-0 select-none z-30 shadow-sm transition-colors duration-300">
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

      {/* Navigation Links */}
      <nav className="px-4 py-5 space-y-1.5 flex-1">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Library & Explore
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-md shadow-slate-900/10 dark:shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-amber-400 dark:text-slate-950' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-400 dark:bg-slate-900 text-slate-950 dark:text-amber-400 font-bold' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* High Fidelity Quality Badge */}
      <div className="mx-4 my-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Full Length 320kbps Audio</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
          Uncompressed streaming & offline IndexedDB storage active.
        </p>
      </div>

      {/* Branding Footer */}
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
