'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import enMessages from '@/messages/en.json';
import ptBRMessages from '@/messages/pt-BR.json';
import huMessages from '@/messages/hu.json';

export type Locale = 'en' | 'pt-BR' | 'hu';

type Messages = typeof enMessages;

const messages: Record<Locale, Messages> = {
  en: enMessages,
  'pt-BR': ptBRMessages,
  hu: huMessages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('xerekinha-locale') as Locale;
      if (saved && messages[saved]) {
        return saved;
      }
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('xerekinha-locale', newLocale);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters like {name} with actual values
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(new RegExp(`\\{${param}\\}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (BR)',
  hu: 'Magyar',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  'pt-BR': '🇧🇷',
  hu: '🇭🇺',
};
