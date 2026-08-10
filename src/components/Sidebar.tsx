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
    <aside className="hidden md:flex flex-col w-70 border-r border-slate-200 bg-white/95 backdrop-blur-xl h-screen sticky top-0 shrink-0 select-none z-30 shadow-sm">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onTabChange('home')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Music2 className="w-6 h-6 fill-current text-slate-950" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tight text-slate-900 leading-none">
              FREE MUSIC
            </h1>
            <p className="text-[10px] font-bold text-amber-600 tracking-wider uppercase mt-1">
              SURAJ KHANDAGALE
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="px-4 py-5 space-y-1.5 flex-1">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
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
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* High Fidelity Quality Badge */}
      <div className="mx-4 my-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Full Length 320kbps Audio</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug font-medium">
          Uncompressed streaming & offline IndexedDB storage active.
        </p>
      </div>

      {/* Branding Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
        <span className="text-[11px] font-bold text-slate-700 tracking-wide uppercase">
          FREE MUSIC
        </span>
        <p className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">
          SURAJ KHANDAGALE
        </p>
      </div>
    </aside>
  );
};
