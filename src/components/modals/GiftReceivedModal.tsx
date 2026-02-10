'use client';

import { PlayingCard } from '@/components/ui';
import { Card } from '@/lib/game-engine/types';

interface GiftReceivedModalProps {
  isOpen: boolean;
  senderName: string;
  drinkCount: number;
  card?: Card | null;
  onConfirm: () => void;
}

export function GiftReceivedModal({
  isOpen,
  senderName,
  drinkCount,
  card,
  onConfirm,
}: GiftReceivedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/90 via-pink-500/20 to-black/90 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Gift Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-500/20 border border-pink-400 rounded-full">
          <span className="text-lg">🎁</span>
          <span className="text-pink-400 text-sm font-semibold uppercase tracking-wide">
            Gift Received
          </span>
        </div>

        {/* Sender Info */}
        <div className="text-center">
          <p className="text-white/70 text-sm mb-1">From</p>
          <h2 className="text-2xl font-bold text-gold">
            {senderName}
          </h2>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white text-center">
          YOU DRINK!
        </h1>

        {/* Subtitle */}
        <p className="text-white/70 text-sm text-center">
          Someone chose to share their gift with you
        </p>

        {/* Drink Count Display */}
        <div className="relative flex items-center justify-center">
          {/* Beer/Shot Indicator */}
          <div className="flex flex-col items-center">
            <div className="text-7xl mb-2">🍻</div>
            <div className="px-4 py-2 bg-pink-500/30 border border-pink-400 rounded-lg">
              <span className="text-3xl font-black text-white">
                {drinkCount}
              </span>
              <span className="text-pink-400 text-lg font-bold ml-2">
                {drinkCount === 1 ? 'DRINK' : 'DRINKS'}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Card Display */}
        {card && (
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
              Matched Card
            </p>
            <PlayingCard card={{ ...card, faceUp: true }} size="md" />
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg flex items-center justify-center gap-2"
        >
          I've Had My Drink!
          <span className="text-xl">👍</span>
        </button>

        {/* Footer Note */}
        <p className="text-white/40 text-xs uppercase tracking-wider">
          Gift Row • Sharing the Love
        </p>
      </div>
    </div>
  );
}
