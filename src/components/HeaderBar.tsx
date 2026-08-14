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
      alert('To install FREE MUSIC on Android:\n1. Tap your browser menu (⋮)\n2. Select "Add to Home screen" or "Install App"');
    }
  };

  const pageTitles: Partial<Record<TabType, { title: string; subtitle: string }>> = {
    home: { title: 'DISCOVER', subtitle: 'Global Hits & AI Mixes' },
    search: { title: 'SEARCH', subtitle: 'Millions of Songs & Artists' },
    downloads: { title: 'OFFLINE DECK', subtitle: 'Saved Tracks • No Internet Needed' },
    favorites: { title: 'LIKED TRACKS', subtitle: 'Your Personal Collection' },
    history: { title: 'HISTORY', subtitle: 'Recent Searches & Plays' },
    dashboard: { title: 'ADMIN PORTAL', subtitle: 'Telemetry & Cloud Logs' },
    playlists: { title: 'PLAYLISTS', subtitle: 'Custom Curations' },
    account: { title: 'ACCOUNT', subtitle: 'User Settings' },
    login: { title: 'SIGN IN', subtitle: 'Access Profile' },
    signup: { title: 'REGISTER', subtitle: 'Create Account' },
  };

  const currentMeta = pageTitles[currentTab] || { title: 'FREE MUSIC', subtitle: 'Unlimited High-Fidelity Audio' };

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-950/75 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3 shadow-xs transition-colors duration-300">
      {/* Brand & Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => onTabChange('home')}
        >
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <Music className="w-5 h-5 fill-current" />
            {isOffline && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tighter text-slate-900 dark:text-white leading-none">
                FREE MUSIC
              </span>
              <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-black tracking-widest uppercase">
                320K
              </span>
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-0.5 truncate">
              BY SURAJ KHANDAGALE
            </span>
          </div>
        </div>

        {/* Desktop Page Title Divider */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider text-slate-900 dark:text-slate-100 uppercase">
              {currentMeta.title}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {currentMeta.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Offline / Flight Mode Indicator Pill */}
        {isOffline ? (
          <button
            onClick={() => onTabChange('downloads')}
            title="Flight Mode Active — Click to view Offline Deck"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition shadow-xs animate-pulse cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Mode</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Live Stream</span>
          </div>
        )}

        {/* Install Android PWA App Button */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            aria-label="Install App"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Admin Dashboard Portal Button */}
        <button
          onClick={() => onTabChange('dashboard')}
          aria-label="Admin Dashboard"
          title="Admin Dashboard Portal"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
            isAdmin
              ? 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-400'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isAdmin ? 'text-slate-950' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">{isAdmin ? 'Dashboard' : 'Admin'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition shadow-xs cursor-pointer border border-slate-200/80 dark:border-slate-800"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 fill-slate-600/20" />
          )}
        </button>
      </div>
    </header>
  );
};
