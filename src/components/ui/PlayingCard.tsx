'use client';

import { Card, Suit } from '@/lib/game-engine/types';
import { getSuitSymbol, getSuitColor } from '@/lib/game-engine/deck';
import styles from './PlayingCard.module.css';

interface PlayingCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  highlighted?: boolean;
  className?: string;
}

function getValueDisplay(value: number): string {
  switch (value) {
    case 1: return 'A';
    case 11: return 'J';
    case 12: return 'Q';
    case 13: return 'K';
    default: return value.toString();
  }
}

// Get the suit pip layout for number cards (patterns like real playing cards)
function getSuitLayout(value: number): { position: string; inverted?: boolean }[] {
  const layouts: Record<number, { position: string; inverted?: boolean }[]> = {
    1: [{ position: 'center-single' }], // Ace
    2: [
      { position: 'top-center' },
      { position: 'bottom-center', inverted: true }
    ],
    3: [
      { position: 'top-center' },
      { position: 'middle-center' },
      { position: 'bottom-center', inverted: true }
    ],
    4: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
    5: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'middle-center' },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
    6: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'mid-left' },
      { position: 'mid-right' },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
    7: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'mid-top-center' },
      { position: 'mid-left' },
      { position: 'mid-right' },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
    8: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'mid-top-center' },
      { position: 'mid-left' },
      { position: 'mid-right' },
      { position: 'mid-bottom-center', inverted: true },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
    9: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'upper-mid-left' },
      { position: 'upper-mid-right' },
      { position: 'middle-center' },
      { position: 'lower-mid-left', inverted: true },
      { position: 'lower-mid-right', inverted: true },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
    10: [
      { position: 'top-left' },
      { position: 'top-right' },
      { position: 'mid-top-center' },
      { position: 'upper-mid-left' },
      { position: 'upper-mid-right' },
      { position: 'lower-mid-left', inverted: true },
      { position: 'lower-mid-right', inverted: true },
      { position: 'mid-bottom-center', inverted: true },
      { position: 'bottom-left', inverted: true },
      { position: 'bottom-right', inverted: true }
    ],
  };
  return layouts[value] || [];
}

// Face card symbols
function getFaceSymbol(value: number): string {
  switch (value) {
    case 11: return '♞'; // Knight for Jack
    case 12: return '♛'; // Queen
    case 13: return '♚'; // King
    default: return '';
  }
}

export function PlayingCard({ 
  card, 
  size = 'md', 
  onClick, 
  highlighted = false,
  className = '' 
}: PlayingCardProps) {
  const sizeClasses = {
    sm: styles.cardSm,
    md: styles.cardMd,
    lg: styles.cardLg,
  };

  const colorClass = card.faceUp 
    ? getSuitColor(card.suit) === 'red' ? styles.red : styles.black
    : '';

  const isFaceCard = card.value >= 11 && card.value <= 13;
  const isAce = card.value === 1;
  const suitSymbol = getSuitSymbol(card.suit);
  const layout = getSuitLayout(card.value);

  return (
    <div 
      className={`
        ${styles.card} 
        ${sizeClasses[size]} 
        ${card.faceUp ? styles.faceUp : styles.faceDown}
        ${colorClass}
        ${highlighted ? styles.highlighted : ''}
        ${onClick ? styles.clickable : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {card.faceUp ? (
        <>
          {/* Top corner */}
          <div className={`${styles.corner} ${styles.cornerTop}`}>
            <div className={styles.cornerValue}>{getValueDisplay(card.value)}</div>
            <div className={styles.cornerSuit}>{suitSymbol}</div>
          </div>
          
          {/* Card center content */}
          <div className={styles.cardBody}>
            {isAce ? (
              // Ace - large central suit symbol
              <div className={styles.aceCenter}>
                <span className={styles.aceSuit}>{suitSymbol}</span>
              </div>
            ) : isFaceCard ? (
              // Face cards - show face symbol and suit decorations
              <div className={styles.faceCardCenter}>
                <span className={styles.faceSymbol}>{getFaceSymbol(card.value)}</span>
                <div className={styles.faceDecorations}>
                  <span className={styles.faceSuit}>{suitSymbol}</span>
                  <span className={styles.faceSuit}>{suitSymbol}</span>
                </div>
              </div>
            ) : (
              // Number cards - show suit pattern
              <div className={styles.pipGrid}>
                {layout.map((pip, idx) => (
                  <span 
                    key={idx}
                    className={`${styles.pip} ${styles[pip.position.replace(/-/g, '_')]} ${pip.inverted ? styles.pipInverted : ''}`}
                  >
                    {suitSymbol}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Bottom corner */}
          <div className={`${styles.corner} ${styles.cornerBottom}`}>
            <div className={styles.cornerValue}>{getValueDisplay(card.value)}</div>
            <div className={styles.cornerSuit}>{suitSymbol}</div>
          </div>
        </>
      ) : (
        <div className={styles.back}>
          <div className={styles.backPattern}></div>
        </div>
      )}
    </div>
  );
}

export function CardPlaceholder({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: styles.cardSm,
    md: styles.cardMd,
    lg: styles.cardLg,
  };

  return (
    <div className={`${styles.card} ${sizeClasses[size]} ${styles.placeholder}`}>
      <div className={styles.placeholderInner}></div>
    </div>
  );
}
