import React from 'react';
import { Music } from 'lucide-react';
import { TabType } from '../types';

interface HeaderBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
      {/* Title / Mobile Brand Banner */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Music className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base text-slate-900 tracking-tight leading-none">SONIC CURRENT</span>
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">SURAJ KHANDAGALE</span>
          </div>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            {currentTab === 'home' && 'Discover Music'}
            {currentTab === 'search' && 'Search Library'}
            {currentTab === 'history' && 'Search & Playback History'}
            {currentTab === 'favorites' && 'Your Liked Tracks'}
            {currentTab === 'downloads' && 'Offline Library'}
          </h2>
        </div>
      </div>
    </header>
  );
};


