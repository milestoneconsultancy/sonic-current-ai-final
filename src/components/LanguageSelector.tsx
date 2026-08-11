import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';

export const ALL_LANGUAGES = [
  'All Indian Languages',
  'Hindi',
  'Marathi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Assamese',
  'Odia',
  'Urdu',
  'English',
];

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (langs: string[]) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (lang: string) => {
    if (lang === 'All Indian Languages') {
      if (selectedLanguages.includes('All Indian Languages')) {
        onChange(['Hindi']);
      } else {
        onChange(['All Indian Languages']);
      }
      return;
    }

    let updated = selectedLanguages.filter((l) => l !== 'All Indian Languages');

    if (updated.includes(lang)) {
      updated = updated.filter((l) => l !== lang);
    } else {
      updated.push(lang);
    }

    if (updated.length === 0) {
      updated = ['Hindi'];
    }

    onChange(updated);
  };

  const displayText =
    selectedLanguages.includes('All Indian Languages') || selectedLanguages.length === 0
      ? 'All Indian Languages'
      : selectedLanguages.join(', ');

  return (
    <div className={`relative inline-block w-full max-w-xs ${className}`} ref={dropdownRef}>
      {/* Single Language Selection Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/80 shadow-sm transition-all duration-200 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <Globe className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none mb-0.5">
              Languages
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {displayText}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-500' : ''
          }`}
        />
      </button>

      {/* Multi-Select Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
            <span>Select Preferred Languages</span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400">Multi-Select</span>
          </div>

          {ALL_LANGUAGES.map((lang) => {
            const isSelected =
              lang === 'All Indian Languages'
                ? selectedLanguages.includes('All Indian Languages')
                : selectedLanguages.includes(lang) && !selectedLanguages.includes('All Indian Languages');

            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleToggle(lang)}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{lang}</span>
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                      : 'border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
