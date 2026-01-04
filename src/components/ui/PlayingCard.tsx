'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/lib/game-engine/types';
import styles from './PlayingCard.module.css';

interface PlayingCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  highlighted?: boolean;
  className?: string;
}

// Map card value to rank name for Cardmeister
function getRankName(value: number): string {
  switch (value) {
    case 1: return 'Ace';
    case 11: return 'Jack';
    case 12: return 'Queen';
    case 13: return 'King';
    default: return value.toString();
  }
}

// Map suit string to Cardmeister suit name (capitalize first letter)
function getSuitName(suit: string): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

// Card dimensions for each size
const cardSizes = {
  sm: { width: '70px', height: '98px' },
  md: { width: '90px', height: '126px' },
  lg: { width: '110px', height: '154px' },
};

export function PlayingCard({ 
  card, 
  size = 'md', 
  onClick, 
  highlighted = false,
  className = '' 
}: PlayingCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = cardSizes[size];

  // Create the playing-card element after mount
  useEffect(() => {
    if (!containerRef.current || !card.faceUp) return;

    const container = containerRef.current;
    
    // Clear any existing content
    container.innerHTML = '';

    // Create the playing-card custom element
    const playingCard = document.createElement('playing-card');
    playingCard.setAttribute('rank', getRankName(card.value));
    playingCard.setAttribute('suit', getSuitName(card.suit));
    playingCard.setAttribute('borderradius', '8');
    playingCard.style.width = dimensions.width;
    playingCard.style.height = dimensions.height;
    playingCard.style.display = 'block';
    
    container.appendChild(playingCard);

    return () => {
      container.innerHTML = '';
    };
  }, [card.faceUp, card.value, card.suit, dimensions]);

  const sizeClasses = {
    sm: styles.cardSm,
    md: styles.cardMd,
    lg: styles.cardLg,
  };

  return (
    <div 
      ref={containerRef}
      className={`
        ${styles.card} 
        ${sizeClasses[size]} 
        ${card.faceUp ? styles.faceUpCardmeister : styles.faceDown}
        ${highlighted ? styles.highlighted : ''}
        ${onClick ? styles.clickable : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {!card.faceUp && (
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
