'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { SoundToggle, LanguageSelector } from '@/components/ui';

interface GameHeaderProps {
  phase: 'questions' | 'revelation' | 'ended';
  roundNumber?: number;
  totalRounds?: number;
  onSettingsClick?: () => void;
}

export function GameHeader({
  phase,
  roundNumber = 1,
  totalRounds = 5,
}: GameHeaderProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function getPhaseLabel() {
    switch (phase) {
      case 'questions':
        return `ROUND ${roundNumber}/${totalRounds}`;
      case 'revelation':
        return 'PYRAMID';
      case 'ended':
        return 'GAME OVER';
      default:
        return '';
    }
  }

  function handleBack() {
    router.push('/');
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 30,
      }}
    >
      {/* Gear Button + Phase Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Phase badge - compact inline label */}
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: '#d4af37',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '3px 8px',
          borderRadius: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}>
          {getPhaseLabel()}
        </span>

        {/* Gear icon */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          aria-label="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          background: 'rgba(10, 15, 10, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          padding: '14px 16px',
          minWidth: 200,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
        }}>
          {/* Settings Label */}
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            Settings
          </div>

          {/* Sound Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.8)',
            }}>
              🔊 Sound
            </span>
            <SoundToggle />
          </div>

          {/* Language Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.8)',
            }}>
              🌐 Language
            </span>
            <LanguageSelector />
          </div>

          {/* Back to Home */}
          <button
            onClick={handleBack}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '10px 0',
              borderRadius: 8,
              border: '1px solid rgba(255, 107, 107, 0.3)',
              background: 'rgba(255, 107, 107, 0.1)',
              color: '#ff6b6b',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            ← Leave Game
          </button>
        </div>
      )}
    </div>
  );
}
