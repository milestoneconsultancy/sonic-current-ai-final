import React, { useState, useEffect } from 'react';
import { Music, Sun, Moon, Smartphone, ShieldCheck, WifiOff, Radio } from 'lucide-react';
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
      alert('To install FREE MUSIC on your device:\n1. Tap Share or browser menu (⋮)\n2. Select "Add to Home Screen"');
    }
  };

  const pageTitles: Partial<Record<TabType, { title: string; subtitle: string }>> = {
    home: { title: 'Listen Now', subtitle: 'Top Picks & New Releases' },
    search: { title: 'Search', subtitle: 'Songs, Artists & Playlists' },
    downloads: { title: 'Library', subtitle: 'Downloaded & Offline Music' },
    favorites: { title: 'Liked Tracks', subtitle: 'Your Favorites' },
    history: { title: 'Recently Played', subtitle: 'Recent Activity' },
    dashboard: { title: 'Admin Portal', subtitle: 'System & Analytics' },
    playlists: { title: 'Playlists', subtitle: 'Curated Mixes' },
    account: { title: 'Account', subtitle: 'Settings' },
    login: { title: 'Sign In', subtitle: 'Apple Music Profile' },
    signup: { title: 'Sign Up', subtitle: 'Create Profile' },
  };

  const currentMeta = pageTitles[currentTab] || { title: 'Music', subtitle: 'High-Fidelity Audio' };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/85 dark:bg-[#000000]/85 backdrop-blur-2xl border-b border-[#C6C6C8]/40 dark:border-[#38383A]/60 px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3 select-none transition-colors duration-300">
      {/* Brand & Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onTabChange('home')}
        >
          <div className="relative w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#FA2D48] to-[#FC3C44] text-white flex items-center justify-center shadow-md shadow-[#FA2D48]/25 group-hover:scale-105 transition-transform">
            <Music className="w-5 h-5 fill-current" />
            {isOffline && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FA2D48] border-2 border-white dark:border-black" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-black dark:text-white leading-none">
                Music
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-[9px] font-bold tracking-wide uppercase">
                Free
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 truncate">
              Apple Music Design
            </span>
          </div>
        </div>

        {/* Desktop Page Title */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-[#C6C6C8]/40 dark:border-[#38383A]/60">
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-black dark:text-white">
              {currentMeta.title}
            </span>
            <span className="text-[10px] font-medium text-[#3C3C43]/60 dark:text-[#EBEBF5]/60">
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
            title="Flight Mode Active — Click to view Library"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-xs font-semibold transition cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-[10px] font-bold tracking-wide">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Lossless Stream</span>
          </div>
        )}

        {/* Install Button */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            aria-label="Install App"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] text-black dark:text-white border border-[#C6C6C8]/40 dark:border-[#38383A]/60 text-xs font-medium transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#FA2D48] shrink-0" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Admin Portal Button */}
        <button
          onClick={() => onTabChange('dashboard')}
          aria-label="Admin Dashboard"
          title="Admin Dashboard Portal"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border text-xs font-medium transition cursor-pointer ${
            isAdmin
              ? 'bg-[#FA2D48] text-white border-[#FA2D48]'
              : 'bg-[#F2F2F7] dark:bg-[#1C1C1E] text-black dark:text-white border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isAdmin ? 'text-white' : 'text-[#FA2D48]'}`} />
          <span className="hidden sm:inline">{isAdmin ? 'Dashboard' : 'Admin'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#E5E5EA] transition cursor-pointer border border-[#C6C6C8]/40 dark:border-[#38383A]/60"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#D4A857] fill-[#D4A857]/20" />
          ) : (
            <Moon className="w-4 h-4 text-[#3C3C43]" />
          )}
        </button>
      </div>
    </header>
  );
};

