'use client';

import { PlayingCard } from '@/components/ui';
import { Card } from '@/lib/game-engine/types';

interface OtherPlayerResultModalProps {
  isOpen: boolean;
  playerName: string;
  wasCorrect: boolean;
  prediction: string;
  result: string;
  card: Card | null;
  playerHand?: Card[];
  onConfirm: () => void;
}

export function OtherPlayerResultModal({
  isOpen,
  playerName,
  wasCorrect,
  prediction,
  result,
  card,
  playerHand = [],
  onConfirm,
}: OtherPlayerResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/90 via-danger/30 to-black/90 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between w-full px-2">
          <span className="text-white/50 text-xs uppercase tracking-wider">
            Outcome
          </span>
          <span className="text-danger text-xs font-semibold uppercase tracking-wider animate-pulse">
            • Action Required
          </span>
        </div>


        {/* Player Was Right */}
        <h2 className="text-xl font-bold text-white text-center">
          <span className="text-gold">{playerName}</span> Was Right!
        </h2>

        {/* YOU DRINK Title */}
        <h1 className="text-5xl font-black text-center">
          <span className="text-danger">YOU</span>
          <br />
          <span className="text-white">DRINK!</span>
        </h1>

        {/* Card with Verified Badge */}
        <div className="relative">
          {card && (
            <PlayingCard card={{ ...card, faceUp: true }} size="lg" />
          )}
        </div>

        {/* Other Player's Hand */}
        {playerHand.length > 0 && (
          <div className="w-full text-center">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
              {playerName}'s Hand
            </p>
            <div className="flex justify-center gap-1">
              {playerHand.map((handCard, idx) => (
                <PlayingCard
                  key={handCard.id || idx}
                  card={{ ...handCard, faceUp: true }}
                  size="sm"
                  highlighted={!!(card && handCard.value === card.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-xl">👍</span>
          I've had my drink!
        </button>

        {/* Footer Note */}
        <p className="text-white/40 text-xs uppercase tracking-wider">
          Game Paused Until Confirmation
        </p>
      </div>
    </div>
  );
}
