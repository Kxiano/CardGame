'use client';

import { PlayingCard } from '@/components/ui';
import { Card, Player } from '@/lib/game-engine/types';

interface OtherPlayerDrinkModalProps {
  isOpen: boolean;
  playerName: string;
  rowNumber: number;
  drinkCount: number;
  card: Card | null;
  playerHand?: Card[];
  onConfirm: () => void;
}

export function OtherPlayerDrinkModal({
  isOpen,
  playerName,
  rowNumber,
  drinkCount,
  card,
  playerHand = [],
  onConfirm,
}: OtherPlayerDrinkModalProps) {
  if (!isOpen) return null;

  // Highlight cards that match the revealed card
  const matchValue = card?.value;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/90 via-success/20 to-black/90 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between w-full px-2">
          <span className="text-white/50 text-xs uppercase tracking-wider">
            Pyramid Row {rowNumber}
          </span>
          <span className="text-success text-xs font-semibold uppercase tracking-wider">
            • Drink Row
          </span>
        </div>

        {/* Match Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success/20 border border-success rounded-full">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-success text-sm font-semibold uppercase tracking-wide">
            Card Matched
          </span>
        </div>

        {/* Player Matched */}
        <h2 className="text-xl font-bold text-white text-center">
          <span className="text-gold">{playerName}</span> Matched!
        </h2>

        {/* THEY DRINK Title */}
        <h1 className="text-4xl font-black text-center">
          <span className="text-danger">THEY</span>
          <br />
          <span className="text-white">DRINK!</span>
        </h1>

        {/* Revealed Card */}
        <div className="relative">
          {card && (
            <PlayingCard card={{ ...card, faceUp: true }} size="lg" />
          )}
          {/* Shot Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-danger rounded-full flex items-center gap-1 shadow-lg">
            <span className="text-white text-xs font-semibold uppercase">
              🍺 {drinkCount > 1 ? `${drinkCount} Drinks` : '1 Drink'}
            </span>
          </div>
        </div>

        {/* Show their hand with matching cards highlighted */}
        {playerHand.length > 0 && (
          <div className="w-full text-center">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
              {playerName}'s Matching Card
            </p>
            <div className="flex justify-center gap-1">
              {playerHand.map((handCard, idx) => (
                <PlayingCard
                  key={handCard.id || idx}
                  card={{ ...handCard, faceUp: true }}
                  size="sm"
                  highlighted={matchValue !== undefined && handCard.value === matchValue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onConfirm}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg flex items-center justify-center gap-2"
        >
          Continue
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>

        {/* Footer Note */}
        <p className="text-white/40 text-xs uppercase tracking-wider">
          You're Safe This Round
        </p>
      </div>
    </div>
  );
}
