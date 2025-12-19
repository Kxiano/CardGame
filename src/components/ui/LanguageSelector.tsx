'use client';

import { useI18n, Locale, localeNames, localeFlags } from '@/lib/i18n';
import { useState } from 'react';
import styles from './LanguageSelector.module.css';

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const locales: Locale[] = ['en', 'pt-BR', 'hu'];

  return (
    <div className={styles.container}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className={styles.flag}>{localeFlags[locale]}</span>
        <span className={styles.name}>{localeNames[locale]}</span>
        <svg 
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            {locales.map((loc) => (
              <button
                key={loc}
                className={`${styles.option} ${loc === locale ? styles.optionActive : ''}`}
                onClick={() => {
                  setLocale(loc);
                  setIsOpen(false);
                }}
              >
                <span className={styles.flag}>{localeFlags[loc]}</span>
                <span className={styles.name}>{localeNames[loc]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
