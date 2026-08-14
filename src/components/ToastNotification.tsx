import React, { useEffect } from 'react';
import { CheckCircle2, Loader2, Info, AlertTriangle, X, HardDrive } from 'lucide-react';
import { Song } from '../types';

export interface ToastData {
  id: string;
  type: 'saving' | 'done' | 'info' | 'error';
  title: string;
  message: string;
  song?: Song;
  actionText?: string;
  onAction?: () => void;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast || toast.type === 'saving') return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <aside
      aria-label="Notification alert"
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div
        className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl shadow-2xl backdrop-blur-2xl border transition-all ${
          toast.type === 'done'
            ? 'bg-slate-950/90 dark:bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-500/10'
            : toast.type === 'saving'
            ? 'bg-slate-950/90 dark:bg-slate-900/95 border-amber-500/50 text-white shadow-amber-500/10'
            : toast.type === 'error'
            ? 'bg-slate-950/90 dark:bg-slate-900/95 border-rose-500/50 text-white shadow-rose-500/10'
            : 'bg-slate-950/90 dark:bg-slate-900/95 border-slate-700/80 text-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'done'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : toast.type === 'saving'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : toast.type === 'error'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            {toast.type === 'done' && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === 'saving' && <Loader2 className="w-5 h-5 animate-spin" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
          </div>

          {/* Text Content */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                {toast.title}
              </h4>
              {toast.type === 'done' && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] font-black uppercase tracking-wider shrink-0">
                  DONE ✓
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-300 truncate mt-0.5">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {toast.actionText && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-400 hover:text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{toast.actionText}</span>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Dismiss notification"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
