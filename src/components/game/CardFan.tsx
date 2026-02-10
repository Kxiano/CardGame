'use client';

import { PlayingCard } from '@/components/ui';
import { Card } from '@/lib/game-engine/types';

interface CardFanProps {
  cards: Card[];
  maxVisibleCards?: number;
}

export function CardFan({ cards, maxVisibleCards = 10 }: CardFanProps) {
  if (cards.length === 0) {
    return null;
  }

  const visibleCards = cards.slice(0, maxVisibleCards);
  const cardCount = visibleCards.length;

  // Fan angle: spread cards in a proper arc
  const maxSpread = Math.min(cardCount * 8, 60); // degrees total spread
  const angleStep = cardCount > 1 ? maxSpread / (cardCount - 1) : 0;
  const startAngle = -maxSpread / 2;

  // Overlap: cards overlap horizontally  
  const cardWidth = 50; // xs size width
  const overlapPercent = 0.50; // 50% overlap
  const visibleWidth = cardWidth * (1 - overlapPercent);
  const totalWidth = cardWidth + visibleWidth * (cardCount - 1);

  // Arc lift: center cards rise, edge cards stay low (parabolic curve)
  const maxLift = 12; // max pixels the center card rises

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '2px 8px 4px',
      flexShrink: 0,
      position: 'relative',
      minHeight: 65,
    }}>
      {/* Fan container */}
      <div style={{
        position: 'relative',
        width: totalWidth,
        height: 80,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}>
        {visibleCards.map((card, idx) => {
          const angle = cardCount > 1 ? startAngle + angleStep * idx : 0;
          
          // Parabolic arc: center index gets max lift, edges get 0
          const centerIdx = (cardCount - 1) / 2;
          const normalizedDist = cardCount > 1
            ? Math.abs(idx - centerIdx) / centerIdx
            : 0;
          const liftY = maxLift * (1 - normalizedDist * normalizedDist);

          return (
            <div
              key={card.id}
              style={{
                position: 'absolute',
                left: `${(idx * visibleWidth)}px`,
                bottom: 2,
                transform: `rotate(${angle}deg) translateY(-${liftY}px)`,
                transformOrigin: 'bottom center',
                zIndex: idx,
                transition: 'transform 0.2s ease',
              }}
            >
              <PlayingCard card={card} size="xs" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
