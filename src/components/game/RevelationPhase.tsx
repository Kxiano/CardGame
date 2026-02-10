'use client';

import { useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { PlayingCard } from '@/components/ui';
import { Card, Player, PyramidRow } from '@/lib/game-engine/types';

interface RevelationPhaseProps {
  pyramid: PyramidRow[];
  currentPyramidRow: number;
  currentPyramidCard: number;
  revealedCard: Card | null;
  playerHand: Card[];
  currentPlayer: Player | null;
  isDealer: boolean;
  onRevealCard: () => void;
  onMatchCard?: (cardId: string) => void;
  selectedCardId?: string | null;
}

// Row labels matching the mockup
const ROW_LABELS = [
  { emoji: '🍺', text: 'DRINK X1' },
  { emoji: '🎁', text: 'GIVE X2' },
  { emoji: '🍺', text: 'DRINK X3' },
  { emoji: '🎁', text: 'GIVE X4' },
  { emoji: '🍺', text: 'DRINK X5' },
];

export function RevelationPhase({
  pyramid,
  currentPyramidRow,
  currentPyramidCard,
  revealedCard,
  playerHand,
  currentPlayer,
  isDealer,
  onRevealCard,
  onMatchCard,
  selectedCardId,
}: RevelationPhaseProps) {
  const { t } = useI18n();

  // Check if player can match any card in hand with revealed card
  const canMatch = useMemo(() => {
    if (!revealedCard || !playerHand.length) return false;
    return playerHand.some((card) => card.value === revealedCard.value);
  }, [revealedCard, playerHand]);

  // Get current row info
  const currentRowInfo = useMemo(() => {
    if (currentPyramidRow < 0 || currentPyramidRow >= pyramid.length) return null;
    return pyramid[currentPyramidRow];
  }, [pyramid, currentPyramidRow]);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-lg mx-auto px-2">
      {/* Pyramid Display */}
      <div className="w-full flex flex-col items-center gap-1">
        {pyramid.slice().reverse().map((row, reversedIdx) => {
          const rowIdx = pyramid.length - 1 - reversedIdx;
          const labelInfo = ROW_LABELS[row.rowNumber - 1] || ROW_LABELS[0];
          const isCurrentRow = rowIdx === currentPyramidRow;

          return (
            <div
              key={row.rowNumber}
              className={`flex items-center gap-2 w-full ${
                isCurrentRow ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {/* Row Label */}
              <div className={`
                flex items-center gap-1 min-w-[70px] text-xs font-semibold
                ${row.isDistribute ? 'text-gold' : 'text-white'}
              `}>
                <span>{labelInfo.emoji}</span>
                <span className="uppercase tracking-wide">{labelInfo.text}</span>
              </div>

              {/* Cards in Row */}
              <div className="flex gap-1 flex-wrap justify-center flex-1">
                {row.cards.map((card, cardIdx) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    size="xs"
                    highlighted={
                      isCurrentRow && cardIdx === currentPyramidCard
                    }
                    animation={card.faceUp ? 'flipIn' : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Revealed Card */}
      {revealedCard && (
        <div className="flex flex-col items-center gap-1 py-2">
          <span className="text-xs text-white/50 uppercase tracking-wider">
            Revealed Card
          </span>
          <PlayingCard card={revealedCard} size="md" animation="flipReveal" />
        </div>
      )}

      {/* Dealer Reveal Button */}
      {isDealer && !revealedCard && currentRowInfo && (
        <button
          onClick={onRevealCard}
          className="btn btn-primary btn-lg mt-2"
        >
          {t('game.revealCard') || 'Reveal Card'}
        </button>
      )}

      {/* Current Row Info */}
      {currentRowInfo && (
        <div className="text-center text-white/60 text-xs mt-1">
          {currentRowInfo.isDistribute
            ? `Give ${currentRowInfo.drinkMultiplier} drinks`
            : `Drink ${currentRowInfo.drinkMultiplier} drinks`}
        </div>
      )}
    </div>
  );
}
