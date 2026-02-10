'use client';

import { useState, useEffect } from 'react';
import { Player, Card } from '@/lib/game-engine/types';

interface DrinkingPlayer {
  player: Player;
  matchCount: number;
  status: 'drinking' | 'drank' | 'waiting';
}

interface DrinkRowModalProps {
  isOpen: boolean;
  matchedCard: Card | null;
  drinkMultiplier: number;
  drinkingPlayers: DrinkingPlayer[];
  timeLimit?: number;
  onDone: () => void;
}

export function DrinkRowModal({
  isOpen,
  matchedCard,
  drinkMultiplier,
  drinkingPlayers,
  timeLimit = 30,
  onDone,
}: DrinkRowModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(timeLimit);
    }
  }, [isOpen, timeLimit]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining]);

  if (!isOpen) return null;

  // Get card value display
  const cardValueDisplay = matchedCard ? `${matchedCard.value}♠` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/90 via-danger/20 to-black/90 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Beer Icon */}
        <div className="text-5xl">🍺</div>

        {/* Title */}
        <h1 className="text-4xl font-black text-center">
          <span className="text-danger">Players</span>
          {' '}
          <span className="text-white">Drink!</span>
        </h1>

        {/* Match Info */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
          <span className="text-white/70 text-sm">
            Matched {cardValueDisplay}
          </span>
          <span className="text-white/50">•</span>
          <span className="text-gold font-semibold text-sm">
            Take {drinkMultiplier}
          </span>
        </div>

        {/* Timer */}
        <p className="text-white/50 text-sm">
          ⏱️ {timeRemaining} seconds remaining
        </p>

        {/* Players List */}
        <div className="w-full space-y-3">
          {drinkingPlayers.map(({ player, matchCount, status }) => (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-3 rounded-xl
                ${status === 'drank' ? 'bg-success/10 border border-success/30' : 'bg-white/5 border border-white/10'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold">
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  {status === 'drank' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{player.nickname}</p>
                  <p className="text-white/50 text-xs">{matchCount} match</p>
                </div>
              </div>

              {/* Status Indicator */}
              <div>
                {status === 'drinking' && (
                  <span className="px-3 py-1 bg-warning/20 text-warning text-xs font-semibold rounded-full animate-pulse">
                    Drinking...
                  </span>
                )}
                {status === 'drank' && (
                  <span className="px-3 py-1 bg-success/20 text-success text-xs font-semibold rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Drank!
                  </span>
                )}
                {status === 'waiting' && (
                  <span className="px-3 py-1 bg-white/10 text-white/50 text-xs font-semibold rounded-full">
                    Waiting...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Done Button */}
        <button
          onClick={onDone}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-white bg-danger hover:bg-danger/80 transition-all shadow-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
