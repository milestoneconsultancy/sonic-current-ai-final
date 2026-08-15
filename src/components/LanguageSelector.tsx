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
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[14px] bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-[#C6C6C8]/40 dark:border-[#38383A]/60 hover:border-[#FA2D48] dark:hover:border-[#FA2D48] shadow-xs transition-all duration-200 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <Globe className="w-4 h-4 text-[#FA2D48] shrink-0 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] leading-none mb-0.5">
              Languages
            </span>
            <span className="text-xs font-semibold text-black dark:text-white truncate leading-tight">
              {displayText}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#8E8E93] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#FA2D48]' : ''
          }`}
        />
      </button>

      {/* Multi-Select Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-[#FFFFFF]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-[#C6C6C8]/50 dark:border-[#38383A]/70 rounded-[16px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-2 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50 mb-1 flex items-center justify-between">
            <span>Select Languages</span>
            <span className="text-[9px] text-[#FA2D48]">Multi-Select</span>
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
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FA2D48]/10 text-[#FA2D48] font-semibold'
                    : 'text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>{lang}</span>
                <div
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#FA2D48] border-[#FA2D48] text-white font-bold'
                      : 'border-[#C6C6C8] dark:border-[#545458] bg-transparent'
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

