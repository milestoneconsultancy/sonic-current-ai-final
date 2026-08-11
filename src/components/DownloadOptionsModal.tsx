import React, { useState } from 'react';
import { Smartphone, HardDrive, Download, Check, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { Song } from '../types';

interface DownloadOptionsModalProps {
  song: Song | null;
  onClose: () => void;
  onSaveAppLibrary: (song: Song) => Promise<void>;
  onSaveDevice: (song: Song, onProgress: (pct: number) => void) => Promise<boolean>;
}

export const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({
  song,
  onClose,
  onSaveAppLibrary,
  onSaveDevice,
}) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'permission_prompt' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [targetType, setTargetType] = useState<'app' | 'device'>('app');

  if (!song) return null;

  const handleAppSave = async () => {
    setTargetType('app');
    setDownloadState('downloading');
    setProgress(20);
    try {
      const timer = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 20));
      }, 150);

      await onSaveAppLibrary(song);
      clearInterval(timer);
      setProgress(100);
      setDownloadState('success');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save to App Offline Library');
      setDownloadState('error');
    }
  };

  const handleDeviceSave = async () => {
    setTargetType('device');
    setDownloadState('downloading');
    setProgress(0);

    try {
      // Check if Android Capacitor or Web
      const isCapacitor = (window as any).Capacitor !== undefined;

      if (isCapacitor) {
        // Request storage permission simulation / check
        setDownloadState('permission_prompt');
        return;
      }

      const success = await onSaveDevice(song, (pct) => setProgress(pct));
      if (success) {
        setProgress(100);
        setDownloadState('success');
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error('Device download failed during verification.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not write file to device storage.');
      setDownloadState('error');
    }
  };

  const handleGrantPermission = async () => {
    setDownloadState('downloading');
    setProgress(10);
    try {
      const success = await onSaveDevice(song, (pct) => setProgress(pct));
      if (success) {
        setProgress(100);
        setDownloadState('success');
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error('Android file write verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Permission denied or storage error.');
      setDownloadState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={downloadState === 'downloading'}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black border border-amber-500/20 shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
              Save Offline
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {song.title} — {song.artist}
            </p>
          </div>
        </div>

        {/* IDLE STATE: CHOOSE LOCATION */}
        {downloadState === 'idle' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Where do you want to save this song?
            </p>

            <button
              onClick={handleAppSave}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 transition duration-200 cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    1. App Offline Library
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Fast in-app IndexedDB storage. Plays without internet.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleDeviceSave}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 transition duration-200 cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    2. Device Storage
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Download actual audio file to Downloads/Music folder.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* PERMISSION PROMPT STATE */}
        {downloadState === 'permission_prompt' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Storage Permission Required
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Storage access is required to save this song to your Android device files.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDownloadState('idle')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleGrantPermission}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                ALLOW & DOWNLOAD
              </button>
            </div>
          </div>
        )}

        {/* DOWNLOADING STATE WITH PROGRESS PERCENTAGE */}
        {downloadState === 'downloading' && (
          <div className="space-y-4 text-center py-4">
            <div className="text-3xl font-black font-mono text-amber-500 tracking-tight">
              {progress}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                style={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-200 shadow-xs"
              />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 animate-pulse">
              Downloading audio file & verifying integrity...
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {downloadState === 'success' && (
          <div className="space-y-3 text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {targetType === 'device' ? 'Saved to Device Downloads!' : 'Saved to App Offline Library!'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Audio file verified and ready for offline playback.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {downloadState === 'error' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Download Failed</h3>
              <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setDownloadState('idle')}
              className="w-full py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
