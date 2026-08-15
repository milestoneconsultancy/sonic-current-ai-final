import React from 'react';
import { Compass, Search, Download, LayoutDashboard, Heart, Radio } from 'lucide-react';
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
    { id: 'instantmix', label: 'Radio', icon: Radio },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'downloads', label: 'Library', icon: Download, badge: downloadsCount },
  ];

  if (isAdmin) {
    tabs.push({ id: 'dashboard', label: 'Admin', icon: LayoutDashboard });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/85 dark:bg-[#121212]/85 backdrop-blur-xl border-t border-[#C6C6C8]/40 dark:border-[#38383A]/50 px-2 py-1.5 flex items-center justify-around select-none transition-colors duration-200 pb-[env(safe-area-inset-bottom,8px)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 transition-colors duration-150 cursor-pointer min-w-[54px] ${
              isActive ? 'text-[#FA2D48]' : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? 'stroke-[2.5] scale-105 text-[#FA2D48]' : 'stroke-[1.7] text-[#8E8E93]'
                }`}
              />
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#FA2D48] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {tab.badge}
                </span>
              ) : null}
            </div>

            <span
              className={`text-[10px] tracking-tight leading-none mt-1 ${
                isActive ? 'font-semibold text-[#FA2D48]' : 'font-normal text-[#8E8E93]'
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
