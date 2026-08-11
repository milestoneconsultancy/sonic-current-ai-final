import React from 'react';
import { Globe, Plus, Settings, X, ShieldAlert } from 'lucide-react';

interface WrongLanguageAlertModalProps {
  detectedLanguage: string;
  selectedLanguages: string[];
  onClose: () => void;
  onChangeLanguage: () => void;
  onAddLanguage: (lang: string) => void;
}

export const WrongLanguageAlertModal: React.FC<WrongLanguageAlertModalProps> = ({
  detectedLanguage,
  selectedLanguages,
  onClose,
  onChangeLanguage,
  onAddLanguage,
}) => {
  if (!detectedLanguage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black border border-amber-500/20 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Language Preference Restriction
            </h2>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Active Selection: {selectedLanguages.join(', ')}
            </p>
          </div>
        </div>

        {/* Alert Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Search Result Filtered</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            This song is in <span className="font-extrabold text-slate-900 dark:text-white">{detectedLanguage}</span>, but {detectedLanguage} is not in your selected languages.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => onAddLanguage(detectedLanguage)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs tracking-wide shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD {detectedLanguage.toUpperCase()} TO LANGUAGES</span>
          </button>

          <button
            onClick={onChangeLanguage}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>CHANGE LANGUAGE SELECTION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
