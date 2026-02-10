'use client';

import { useState, useEffect, useMemo } from 'react';
import { Player } from '@/lib/game-engine/types';

interface GiftSelectionModalProps {
  isOpen: boolean;
  drinksToGive: number;
  players: Player[];
  currentPlayerId: string;
  timeLimit?: number; // seconds
  onConfirm: (selectedPlayerIds: string[]) => void;
}

export function GiftSelectionModal({
  isOpen,
  drinksToGive,
  players,
  currentPlayerId,
  timeLimit = 30,
  onConfirm,
}: GiftSelectionModalProps) {
  // Track drinks per player: { playerId: drinkCount }
  const [drinkAssignments, setDrinkAssignments] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDrinkAssignments({});
      setTimeRemaining(timeLimit);
    }
  }, [isOpen, timeLimit]);

  // Calculate total drinks assigned
  const drinksAssigned = useMemo(() => 
    Object.values(drinkAssignments).reduce((sum, count) => sum + count, 0),
    [drinkAssignments]
  );
  const drinksLeft = drinksToGive - drinksAssigned;

  // Build selectedPlayerIds array for onConfirm (repeat IDs based on drink count)
  const selectedPlayerIds = useMemo(() => {
    const ids: string[] = [];
    for (const [playerId, count] of Object.entries(drinkAssignments)) {
      for (let i = 0; i < count; i++) {
        ids.push(playerId);
      }
    }
    return ids;
  }, [drinkAssignments]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-confirm with current selection when time runs out
          if (selectedPlayerIds.length > 0) {
            onConfirm(selectedPlayerIds);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining, selectedPlayerIds, onConfirm]);

  // Filter out current player
  const availablePlayers = players.filter(p => p.id !== currentPlayerId);

  function addDrinkToPlayer(playerId: string) {
    if (drinksLeft <= 0) return;
    
    setDrinkAssignments(prev => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1,
    }));
  }

  function removeDrinkFromPlayer(playerId: string, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent adding a drink when clicking the badge
    
    setDrinkAssignments(prev => {
      const current = prev[playerId] || 0;
      if (current <= 1) {
        // Remove the player entirely
        const { [playerId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [playerId]: current - 1,
      };
    });
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
        {/* Timer */}
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full border border-gold/30">
          <span className="text-2xl">⏱️</span>
          <span className="text-white font-mono text-xl font-bold">
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Drinks to Give */}
        <div className="text-center">
          <div className="text-6xl text-gold font-black">+{drinksToGive}</div>
          <h2 className="text-2xl font-bold text-white mt-2">
            Drinks to Give
          </h2>
          <p className="text-white/60 text-sm mt-1">
            You matched a gift row card! Tap players to assign drinks.
          </p>
        </div>

        {/* Player Selection */}
        <div className="w-full">
          <p className="text-gold text-xs uppercase tracking-wider text-center mb-3">
            Tap to Add Drinks • Tap Badge to Remove
          </p>
          <div className="grid grid-cols-2 gap-3">
            {availablePlayers.map((player) => {
              const drinkCount = drinkAssignments[player.id] || 0;
              const isSelected = drinkCount > 0;
              
              return (
                <button
                  key={player.id}
                  onClick={() => addDrinkToPlayer(player.id)}
                  disabled={drinksLeft <= 0 && !isSelected}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isSelected
                      ? 'bg-gold/20 border-2 border-gold'
                      : drinksLeft <= 0
                        ? 'bg-white/5 border-2 border-transparent opacity-50 cursor-not-allowed'
                        : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                    }
                  `}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold">
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    {isSelected && (
                      <button
                        onClick={(e) => removeDrinkFromPlayer(player.id, e)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center text-gray-900 font-bold text-sm hover:bg-gold-light transition-colors shadow-lg"
                        title="Click to remove a drink"
                      >
                        {drinkCount}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium text-sm truncate">
                      {player.nickname}
                    </span>
                    {isSelected && (
                      <span className="text-gold text-xs">
                        🍺 ×{drinkCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => onConfirm(selectedPlayerIds)}
          disabled={selectedPlayerIds.length === 0}
          className="w-full py-4 px-8 rounded-xl font-bold text-lg text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Confirm Distribution
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>

        {/* Drinks Left Indicator */}
        <p className={`text-xs font-semibold ${drinksLeft > 0 ? 'text-warning' : 'text-success'}`}>
          {drinksLeft > 0 
            ? `• ${drinksLeft} ${drinksLeft === 1 ? 'drink' : 'drinks'} left to assign`
            : '✓ All drinks assigned!'
          }
        </p>
      </div>
    </div>
  );
}

