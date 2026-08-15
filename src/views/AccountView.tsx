import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  User as UserIcon,
  LogOut,
  Cloud,
  RefreshCw,
  Heart,
  Clock,
  Download,
  ListMusic,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface AccountViewProps {
  user: User | null;
  favoritesCount: number;
  historyCount: number;
  playlistsCount: number;
  downloadsCount: number;
  onSyncLocalData: () => Promise<void>;
  onNavigateTab: (tab: any) => void;
  onSignOut: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  favoritesCount,
  historyCount,
  playlistsCount,
  downloadsCount,
  onSyncLocalData,
  onNavigateTab,
  onSignOut,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await onSyncLocalData();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2 pb-24 animate-in fade-in duration-200">
      {/* Header Profile Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#1C1C1E] text-black dark:text-white p-6 sm:p-7 rounded-[20px] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FA2D48] text-white flex items-center justify-center font-bold text-2xl shadow-xs">
              {user?.displayName ? user.displayName[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'A'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
                  {user?.displayName || 'Free Music User'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] text-[10px] font-bold uppercase tracking-wider">
                  {user ? 'Subscriber' : 'Free Member'}
                </span>
              </div>
              <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">
                {user?.email || 'Listening in Free Mode • Designed by Suraj Khandagale'}
              </p>
            </div>
          </div>

          {user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#FA2D48]/15 text-black dark:text-white hover:text-[#FA2D48] text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Real Library Summary Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider px-1">
          Your Library
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigateTab('favorites')}
            className="p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs hover:border-[#FA2D48] transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-[#FA2D48] transition-colors" />
            </div>
            <div className="text-xl font-bold text-black dark:text-white">{favoritesCount}</div>
            <div className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">Liked Songs</div>
          </div>

          <div
            onClick={() => onNavigateTab('playlists')}
            className="p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs hover:border-[#FA2D48] transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center">
                <ListMusic className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-[#FA2D48] transition-colors" />
            </div>
            <div className="text-xl font-bold text-black dark:text-white">{playlistsCount}</div>
            <div className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">Playlists</div>
          </div>

          <div
            onClick={() => onNavigateTab('history')}
            className="p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs hover:border-[#FA2D48] transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-[#FA2D48] transition-colors" />
            </div>
            <div className="text-xl font-bold text-black dark:text-white">{historyCount}</div>
            <div className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">Recently Played</div>
          </div>

          <div
            onClick={() => onNavigateTab('downloads')}
            className="p-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs hover:border-[#FA2D48] transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-[#FA2D48] transition-colors" />
            </div>
            <div className="text-xl font-bold text-black dark:text-white">{downloadsCount}</div>
            <div className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">Offline Tracks</div>
          </div>
        </div>
      </div>

      {/* Cloud Synchronization Section */}
      {user ? (
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">Cloud Sync & Backup</h3>
              <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">
                Seamlessly synchronize your local favorites, history and playlists to your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50">
            <p className="text-xs font-normal text-[#3C3C43]/70 dark:text-[#8E8E93]">
              Last synced: <span className="font-semibold text-black dark:text-white">Just now</span>
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="py-2 px-4 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing with Cloud...' : 'Sync Local Data to Cloud'}
            </button>
          </div>

          {syncSuccess && (
            <div className="p-3 rounded-[12px] bg-[#34C759]/10 border border-[#34C759]/30 text-[#34C759] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
              Your local favorites, play history and playlists are synchronized with your cloud account!
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#FA2D48]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">Sync Across Devices</h3>
              <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">
                You are currently in Guest Mode. Create a free profile to back up your music library to the cloud.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => onNavigateTab('signup')}
              className="py-2 px-4 rounded-full bg-[#FA2D48] text-white hover:bg-[#FC3C44] text-xs font-semibold cursor-pointer transition shadow-xs"
            >
              Create Profile
            </button>
            <button
              onClick={() => onNavigateTab('login')}
              className="py-2 px-4 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold cursor-pointer transition"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Audio & System Information */}
      <div className="p-6 rounded-[20px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-black/5 dark:bg-white/10 text-black dark:text-white flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-black dark:text-white">Audio Quality & Preferences</h3>
            <p className="text-xs text-[#3C3C43]/70 dark:text-[#8E8E93] font-normal">
              High definition stream configurations
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-[#C6C6C8]/30 dark:border-[#38383A]/50 text-xs">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#3C3C43]/80 dark:text-[#EBEBF5]/80 font-medium">Audio Stream Quality</span>
            <span className="font-semibold text-[#FA2D48] bg-[#FA2D48]/10 px-2.5 py-0.5 rounded-full">
              Free Music Lossless 24-bit / 48kHz
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#3C3C43]/80 dark:text-[#EBEBF5]/80 font-medium">Offline Storage Engine</span>
            <span className="font-semibold text-black dark:text-white">IndexedDB Persistent Cache</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#3C3C43]/80 dark:text-[#EBEBF5]/80 font-medium">Spatial Audio</span>
            <span className="font-semibold text-black dark:text-white">Dolby Atmos Dynamic Stereo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
