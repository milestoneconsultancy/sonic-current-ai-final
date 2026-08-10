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
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header Profile Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8 select-none pointer-events-none text-9xl font-black">
          ⚡
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 text-amber-500 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-amber-300/40">
              {user?.displayName ? user.displayName[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'G'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-950 tracking-tight">
                  {user?.displayName || 'Guest User'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  {user ? 'Verified Account' : 'Guest Mode'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900/80">
                {user?.email || 'Listening as Guest • Sign in to enable cross-device cloud sync'}
              </p>
            </div>
          </div>

          {user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-md shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Real Library Summary Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider px-1">
          Your Personal Library
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigateTab('favorites')}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-xl font-black text-slate-900">{favoritesCount}</div>
            <div className="text-xs font-bold text-slate-500">Liked Songs</div>
          </div>

          <div
            onClick={() => onNavigateTab('playlists')}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ListMusic className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-xl font-black text-slate-900">{playlistsCount}</div>
            <div className="text-xs font-bold text-slate-500">Playlists</div>
          </div>

          <div
            onClick={() => onNavigateTab('history')}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-xl font-black text-slate-900">{historyCount}</div>
            <div className="text-xs font-bold text-slate-500">Recently Played</div>
          </div>

          <div
            onClick={() => onNavigateTab('downloads')}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-xl font-black text-slate-900">{downloadsCount}</div>
            <div className="text-xs font-bold text-slate-500">Offline Tracks</div>
          </div>
        </div>
      </div>

      {/* Cloud Synchronization Section */}
      {user ? (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Cloud Sync & Backup</h3>
              <p className="text-xs font-medium text-slate-500">
                Seamlessly synchronize your local favorites, history and metadata to your cloud account.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-600">
              Last synced: <span className="font-bold text-slate-800">Just now</span>
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing with Cloud...' : 'Sync Local Data to Cloud'}
            </button>
          </div>

          {syncSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Your local favorites, play history and playlists are synchronized with your cloud account!
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Sync Across Devices</h3>
              <p className="text-xs font-medium text-amber-900/80">
                You are currently in Guest Mode. Create a free account to back up your music library to the cloud.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onNavigateTab('signup')}
              className="py-2.5 px-5 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-extrabold cursor-pointer transition"
            >
              Create Free Account
            </button>
            <button
              onClick={() => onNavigateTab('login')}
              className="py-2.5 px-5 rounded-2xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 text-xs font-extrabold cursor-pointer transition"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Audio & System Information */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Audio Quality & Preferences</h3>
            <p className="text-xs font-medium text-slate-500">
              High definition stream configurations
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between py-1.5">
            <span className="font-bold text-slate-700">Audio Stream Quality</span>
            <span className="font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              320 kbps High Definition
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="font-bold text-slate-700">Offline Storage Engine</span>
            <span className="font-bold text-slate-800">Local Browser IndexedDB</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="font-bold text-slate-700">Audio Decryption Protocol</span>
            <span className="font-bold text-slate-800">DES ECB Hardware Pipeline</span>
          </div>
        </div>
      </div>

      {/* Branding Footer */}
      <div className="text-center py-6 space-y-1.5 border-t border-slate-200/80">
        <div className="text-xs font-black text-slate-950 tracking-wider uppercase">
          SONIC CURRENT
        </div>
        <p className="text-[11px] font-extrabold text-amber-700 tracking-wider uppercase">
          SURAJ KHANDAGALE
        </p>
      </div>
    </div>
  );
};
