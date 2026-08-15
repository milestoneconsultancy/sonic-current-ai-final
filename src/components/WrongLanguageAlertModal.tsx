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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 rounded-[20px] p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-full bg-[#FA2D48]/10 text-[#FA2D48] flex items-center justify-center font-bold shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black dark:text-white tracking-tight">
              Language Filter Notice
            </h2>
            <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
              Active: {selectedLanguages.join(', ')}
            </p>
          </div>
        </div>

        {/* Alert Notice */}
        <div className="p-4 rounded-[14px] bg-[#FA2D48]/10 border border-[#FA2D48]/20 space-y-2">
          <div className="flex items-center gap-2 text-black dark:text-white font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#FA2D48]" />
            <span>Search Result Filtered</span>
          </div>
          <p className="text-xs text-[#3C3C43]/80 dark:text-[#8E8E93] font-normal leading-relaxed">
            This track is in <span className="font-semibold text-black dark:text-white">{detectedLanguage}</span>, which is not currently selected in your language preferences.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => onAddLanguage(detectedLanguage)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add {detectedLanguage} to Languages</span>
          </button>

          <button
            onClick={onChangeLanguage}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white font-semibold text-xs transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Manage All Languages</span>
          </button>
        </div>
      </div>
    </div>
  );
};
