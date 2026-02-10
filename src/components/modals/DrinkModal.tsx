'use client';

import { PlayingCard } from '@/components/ui';
import { Card } from '@/lib/game-engine/types';

interface DrinkModalProps {
  isOpen: boolean;
  prediction: string;
  result: string;
  card: Card | null;
  drinkCount?: number;
  reason?: string;
  onConfirm: () => void;
}

export function DrinkModal({
  isOpen,
  prediction,
  result,
  card,
  drinkCount = 1,
  reason = 'You answered incorrectly!',
  onConfirm,
}: DrinkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/90 via-danger/20 to-black/90 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        {/* Incorrect Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-danger/20 border border-danger rounded-full">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="text-danger text-sm font-semibold uppercase tracking-wide">
            Incorrect
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white text-center">
          YOU DRINK!
        </h1>


        {/* Card with X mark and Shot indicator */}
        <div className="relative">
          {/* Shot Indicator */}
          <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="text-6xl">🍺</div>
            <div className="mt-1 px-2 py-0.5 bg-gold rounded text-gray-900 font-bold text-xs uppercase">
              {drinkCount > 1 ? `${drinkCount} Shots` : 'Shot'}
            </div>
          </div>

          {card && (
            <PlayingCard card={{ ...card, faceUp: true }} size="lg" />
          )}
          
          {/* X Mark Badge */}
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-danger rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg flex items-center justify-center gap-2"
        >
          I've Had My Drink!
          <span className="text-xl">👍</span>
        </button>

        {/* Reason Footer */}
        <p className="text-white/50 text-xs uppercase tracking-wider">
          {reason}
        </p>
      </div>
    </div>
  );
}
