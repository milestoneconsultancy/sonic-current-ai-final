import React from 'react';
import { Home, Search, Download, LayoutDashboard } from 'lucide-react';
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
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'search', label: 'SEARCH', icon: Search },
    { id: 'downloads', label: 'OFFLINE', icon: Download, badge: downloadsCount },
  ];

  if (isAdmin) {
    tabs.push({ id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center justify-around select-none shadow-[0_-10px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-300 cursor-pointer min-w-[64px] ${
              isActive
                ? 'text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 dark:bg-amber-500/20 scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon
              className={`w-5 h-5 mb-1 transition-transform duration-300 ${
                isActive ? 'text-amber-600 dark:text-amber-400 scale-110' : ''
              }`}
            />
            <span className="text-[10px] font-black tracking-wider uppercase leading-none">
              {tab.label}
            </span>

            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-white dark:ring-slate-900" />
            ) : null}

            {isActive && (
              <span className="absolute bottom-0 w-8 h-1 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
