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
    { id: 'home', label: 'Listen Now', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'downloads', label: 'Library', icon: Download, badge: downloadsCount },
    { id: 'favorites', label: 'Liked', icon: Heart },
  ];

  if (isAdmin) {
    tabs.push({ id: 'dashboard', label: 'Admin', icon: LayoutDashboard });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/85 dark:bg-[#000000]/85 backdrop-blur-2xl border-t border-[#C6C6C8]/40 dark:border-[#38383A]/60 px-1 py-1 flex items-center justify-around select-none transition-colors duration-300 pb-[env(safe-area-inset-bottom,4px)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 cursor-pointer min-w-[54px] ${
              isActive
                ? 'text-[#FA2D48]'
                : 'text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 hover:text-black dark:hover:text-white'
            }`}
          >
            <div className="relative p-0.5">
              <Icon
                className={`w-[22px] h-[22px] transition-transform duration-150 ${
                  isActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'
                }`}
              />
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-0.5 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#FA2D48] text-white text-[9px] font-bold flex items-center justify-center leading-none" />
              ) : null}
            </div>

            <span
              className={`text-[10px] tracking-tight leading-none mt-1 ${
                isActive ? 'font-semibold text-[#FA2D48]' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

