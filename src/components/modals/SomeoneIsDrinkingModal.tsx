'use client';

import { PlayingCard } from '@/components/ui';
import { Card } from '@/lib/game-engine/types';

interface SomeoneIsDrinkingModalProps {
  isOpen: boolean;
  playerName: string;
  drinkCount: number;
  reason: string;
  card?: Card | null;
  onConfirm: () => void;
}

export function SomeoneIsDrinkingModal({
  isOpen,
  playerName,
  drinkCount,
  reason,
  card,
  onConfirm,
}: SomeoneIsDrinkingModalProps) {
  if (!isOpen) return null;

  // Determine if this is a wrong answer scenario
  const isWrongAnswer = reason.includes('incorrectly');
  const isTrucoBackfire = reason.includes('Truco backfired');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        {/* Glow Effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-danger/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Notification Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-danger/30 blur-xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 bg-gray-900 border-2 border-danger/50 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-4xl">🍻</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-danger/20 border border-danger/50 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="text-danger text-sm font-semibold uppercase tracking-wider">
            {isTrucoBackfire ? 'Truco Backfired' : 'Wrong Answer'}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl font-black text-white text-center mb-2">
          <span className="text-gold">{playerName}</span>
        </h1>
        <h2 className="text-2xl font-bold text-danger uppercase tracking-wide mb-4">
          IS DRINKING!
        </h2>

        {/* Drink Count Badge */}
        <div className="flex items-center gap-3 px-6 py-3 bg-gray-900/80 border border-gold/40 rounded-xl mb-4">
          <span className="text-4xl">🍺</span>
          <div className="flex flex-col">
            <span className="text-gold font-black text-2xl">
              {drinkCount} {drinkCount === 1 ? 'Shot' : 'Shots'}
            </span>
          </div>
        </div>

        {/* Card Display (if available) */}
        {card && (
          <div className="mb-4">
            <PlayingCard card={{ ...card, faceUp: true }} size="md" />
          </div>
        )}

        {/* Reason */}
        <p className="text-white/60 text-sm text-center mb-6 px-4 max-w-[280px]">
          {reason}
        </p>

        {/* Continue Button */}
        <button
          onClick={onConfirm}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg flex items-center justify-center gap-2"
        >
          Got it!
          <span className="text-xl">👍</span>
        </button>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-2 opacity-40">
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <span className="text-xs italic text-gold uppercase tracking-widest">
            Question Phase
          </span>
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>
      </div>
    </div>
  );
}
