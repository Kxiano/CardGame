'use client';

import { useEffect } from 'react';
import { PlayingCard } from '@/components/ui';
import { Card, Player } from '@/lib/game-engine/types';

interface SuccessModalProps {
  isOpen: boolean;
  prediction: string;
  result: string;
  card: Card | null;
  otherPlayers: Player[];
  onContinue: () => void;
}

export function SuccessModal({
  isOpen,
  prediction,
  result,
  card,
  otherPlayers,
  onContinue,
}: SuccessModalProps) {
  // Trigger confetti on mount
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Dynamically import confetti
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFD700', '#FFC107'],
        });
      }).catch(() => {
        // Confetti not available, that's fine
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        {/* Correct Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success/20 border border-success rounded-full">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-success text-sm font-semibold uppercase tracking-wide">
            Correct
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white text-center">
          YOU'RE RIGHT!
        </h1>


        {/* Card with Checkmark */}
        <div className="relative">
          {card && (
            <PlayingCard card={{ ...card, faceUp: true }} size="lg" />
          )}
          {/* Checkmark Badge */}
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Other Players Drink */}
        {otherPlayers.length > 0 && (
          <div className="w-full text-center">
            <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">
              Other Players Drink!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {otherPlayers.map((player) => (
                <div key={player.id} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-gray-900 font-bold text-lg border-2 border-gold">
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/70 text-xs">
                    {player.nickname}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg flex items-center justify-center gap-2"
        >
          Continue
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
