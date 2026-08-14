import React from 'react';
import { Compass, Search, Download, LayoutDashboard, Heart } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  downloadsCount: number;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  downloadsCount,
  isAdmin = false,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'downloads', label: 'Offline', icon: Download, badge: downloadsCount },
    { id: 'favorites', label: 'Liked', icon: Heart },
  ];

  if (isAdmin) {
    tabs.push({ id: 'dashboard', label: 'Admin', icon: LayoutDashboard });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/85 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around select-none shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 cursor-pointer min-w-[56px] ${
              isActive
                ? 'text-amber-600 dark:text-amber-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 scale-110'
                  : ''
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <span className="text-[10px] font-black tracking-tight leading-none mt-0.5">
              {tab.label}
            </span>

            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
            ) : null}

            {isActive && (
              <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
