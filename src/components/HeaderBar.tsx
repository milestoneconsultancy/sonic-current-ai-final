import React, { useState, useEffect } from 'react';
import { Music, Sun, Moon, Smartphone } from 'lucide-react';
import { TabType } from '../types';

interface HeaderBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  onTabChange,
  theme,
  onToggleTheme,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install FREE MUSIC on Android:\n1. Tap your browser menu (⋮)\n2. Select "Add to Home screen" or "Install App"');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs transition-colors duration-300">
      {/* Title / Mobile Brand Banner */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Music className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none">FREE MUSIC</span>
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-0.5">SURAJ KHANDAGALE</span>
          </div>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {currentTab === 'home' && 'Discover Music'}
            {currentTab === 'search' && 'Search Library'}
            {currentTab === 'history' && 'Search & Playback History'}
            {currentTab === 'favorites' && 'Your Liked Tracks'}
            {currentTab === 'downloads' && 'Offline Library'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Install Android App Button */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            aria-label="Install Android App"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer border border-slate-200/60 dark:border-slate-700"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600 fill-slate-600/20" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};



