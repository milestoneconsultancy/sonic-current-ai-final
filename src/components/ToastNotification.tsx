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
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-full shadow-2xl backdrop-blur-2xl border bg-[#000000]/90 text-white border-white/15"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'done'
                ? 'bg-[#34C759] text-white'
                : toast.type === 'saving'
                ? 'bg-[#FA2D48] text-white'
                : toast.type === 'error'
                ? 'bg-[#FF3B30] text-white'
                : 'bg-white/20 text-white'
            }`}
          >
            {toast.type === 'done' && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
            {toast.type === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
            {toast.type === 'info' && <Info className="w-4 h-4" />}
          </div>

          {/* Text Content */}
          <div className="min-w-0">
            <h4 className="text-xs font-bold tracking-tight text-white truncate">
              {toast.title}
            </h4>
            <p className="text-[11px] font-normal text-white/70 truncate">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {toast.actionText && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onClose();
              }}
              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[#FA2D48] text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <HardDrive className="w-3 h-3" />
              <span>{toast.actionText}</span>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Dismiss notification"
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
