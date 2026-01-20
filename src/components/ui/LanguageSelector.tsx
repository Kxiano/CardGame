'use client';

import { useI18n, Locale, localeNames, localeFlags } from '@/lib/i18n';
import { useState } from 'react';

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const locales: Locale[] = ['en', 'pt-BR', 'hu'];

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-150 border border-white/10"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span>{localeFlags[locale]}</span>
        <span className="text-sm">{localeNames[locale]}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 py-2 w-48 bg-bg-secondary border border-white/10 rounded-lg shadow-lg z-20">
            {locales.map((loc) => (
              <button
                key={loc}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/10 transition-colors duration-150 ${
                  loc === locale ? 'bg-gold/20 text-gold' : 'text-white'
                }`}
                onClick={() => {
                  setLocale(loc);
                  setIsOpen(false);
                }}
              >
                <span>{localeFlags[loc]}</span>
                <span className="text-sm">{localeNames[loc]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
