import React, { useState, useEffect } from 'react';
import { Music2, Sun, Moon, Smartphone, ShieldCheck, WifiOff, Radio, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface HeaderBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isAdmin?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  onTabChange,
  theme,
  onToggleTheme,
  isAdmin = false,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      alert('To install Free Music on your device:\n1. Tap Share or browser menu (⋮)\n2. Select "Add to Home Screen"');
    }
  };

  const pageTitles: Partial<Record<TabType, { title: string; subtitle: string }>> = {
    home: { title: 'Listen Now', subtitle: 'Top recommendations & charts' },
    instantmix: { title: 'Radio Stations', subtitle: 'Curated genre mixes & continuous flow' },
    search: { title: 'Search', subtitle: 'Find songs, artists, and albums' },
    downloads: { title: 'Downloaded Music', subtitle: 'Offline library' },
    favorites: { title: 'Favorites', subtitle: 'Saved songs & tracks' },
    history: { title: 'Recently Played', subtitle: 'Listening history' },
    dashboard: { title: 'Admin Dashboard', subtitle: 'Server metrics & telemetry' },
    playlists: { title: 'Playlists', subtitle: 'Your library mixes' },
    account: { title: 'Account', subtitle: 'Settings & preferences' },
    login: { title: 'Sign In', subtitle: 'Access Free Music account' },
    signup: { title: 'Sign Up', subtitle: 'Create your account' },
  };

  const currentMeta = pageTitles[currentTab] || { title: 'Free Music', subtitle: 'Designed by Suraj Khandagale' };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/85 dark:bg-[#000000]/85 backdrop-blur-xl border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50 px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3 select-none transition-colors duration-200">
      {/* Brand & Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onTabChange('home')}
        >
          <div className="relative w-9 h-9 rounded-[10px] bg-[#FA2D48] text-white flex items-center justify-center shadow-sm group-hover:bg-[#FC3C44] transition-all duration-200">
            <Music2 className="w-5 h-5 text-white" />
            {isOffline && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF9500] border-2 border-white dark:border-black" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-black dark:text-white leading-none">
                Free Music
              </span>
            </div>
            <span className="text-[11px] font-normal text-[#8E8E93] truncate">
              Designed by Suraj Khandagale
            </span>
          </div>
        </div>

        {/* Desktop Page Title */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-black dark:text-white">
              {currentMeta.title}
            </span>
            <span className="text-[11px] text-[#8E8E93]">
              {currentMeta.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Offline Indicator Pill */}
        {isOffline ? (
          <button
            onClick={() => onTabChange('downloads')}
            title="Offline Music Active"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/30 text-xs font-semibold transition cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Mode</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 text-[11px] font-medium">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Lossless</span>
          </div>
        )}

        {/* Install Button */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            aria-label="Install App"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#1C1C1E] hover:bg-[#D1D1D6] dark:hover:bg-[#2C2C2E] text-black dark:text-white text-xs font-medium transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Admin Portal Button */}
        <button
          onClick={() => onTabChange('dashboard')}
          aria-label="Admin Dashboard"
          title="Admin Dashboard Portal"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            isAdmin
              ? 'bg-[#FA2D48] text-white shadow-xs'
              : 'bg-[#E5E5EA] dark:bg-[#1C1C1E] text-black dark:text-white hover:bg-[#D1D1D6] dark:hover:bg-[#2C2C2E]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{isAdmin ? 'Dashboard' : 'Admin'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E5E5EA] dark:bg-[#1C1C1E] hover:bg-[#D1D1D6] dark:hover:bg-[#2C2C2E] text-black dark:text-white transition cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FF9500]" />
          ) : (
            <Moon className="w-4 h-4 text-[#5856D6]" />
          )}
        </button>
      </div>
    </header>
  );
};
