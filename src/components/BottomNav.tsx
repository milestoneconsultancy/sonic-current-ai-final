import React from 'react';
import { Home, Search, Clock, Heart, Download } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  favoritesCount: number;
  downloadsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
  downloadsCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'favorites', label: 'Liked', icon: Heart, badge: favoritesCount },
    { id: 'downloads', label: 'Offline', icon: Download, badge: downloadsCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around select-none shadow-2xl transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-amber-600 dark:text-amber-400 scale-110' : ''}`} />
            <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
