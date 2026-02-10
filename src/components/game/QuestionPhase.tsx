'use client';

import { useMemo } from 'react';
import { useI18n, Locale } from '@/lib/i18n';
import { PlayingCard } from '@/components/ui';
import { Card, Player } from '@/lib/game-engine/types';

interface Question {
  id: string;
  text: { en: string; 'pt-BR'?: string; hu?: string };
  options: { en: string[]; 'pt-BR'?: string[]; hu?: string[] };
  correctAnswer: string;
}

interface QuestionPhaseProps {
  currentQuestion: Question | null;
  currentTurnPlayer: Player | null;
  isMyTurn: boolean;
  playerHand: Card[];
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionPhase({
  currentQuestion,
  currentTurnPlayer,
  isMyTurn,
  playerHand,
  onAnswer,
  disabled = false,
}: QuestionPhaseProps) {
  const { t, locale } = useI18n();

  // Get localized question text
  const questionText = useMemo(() => {
    if (!currentQuestion) return '';
    return (
      currentQuestion.text[locale as keyof typeof currentQuestion.text] ||
      currentQuestion.text.en
    );
  }, [currentQuestion, locale]);

  // Get localized options
  const options = useMemo(() => {
    if (!currentQuestion) return [];
    return (
      currentQuestion.options[locale as keyof typeof currentQuestion.options] ||
      currentQuestion.options.en
    );
  }, [currentQuestion, locale]);

  if (!currentQuestion || !currentTurnPlayer) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4">
      {/* Current Turn Section */}
      <div className="text-center">
        <span className="text-xs text-white/50 uppercase tracking-wider">
          Current Turn
        </span>
        <h2 className="text-xl font-bold text-white mt-0.5">
          {currentTurnPlayer.nickname}
        </h2>
      </div>

      {/* Question Text */}
      <div className="text-center">
        <h3 className="text-2xl font-black text-white">
          {questionText}
        </h3>
      </div>

      {/* Face-down Card Preview */}
      <div className="my-2">
        <PlayingCard
          card={{ id: 'mystery', suit: 'spades', value: 1, faceUp: false }}
          size="lg"
        />
      </div>

      {/* Answer Buttons - Only show for current player */}
      {isMyTurn && (
        <div className="flex gap-4 w-full">
          {options.map((option, index) => {
            const isEven = index === 0;
            return (
              <button
                key={option}
                onClick={() => onAnswer(option)}
                disabled={disabled}
                className={`
                  flex-1 py-4 rounded-2xl font-bold text-lg
                  transition-all duration-200 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isEven
                    ? 'bg-gradient-to-br from-[#1a5f3c] to-[#0d3a24] hover:from-[#2d8a56] hover:to-[#1a5f3c] text-white border border-[#2d8a56]/50 shadow-lg shadow-[#1a5f3c]/30'
                    : 'bg-gradient-to-br from-[#d4af37] to-[#a68b2a] hover:from-[#f0d77c] hover:to-[#d4af37] text-gray-900 border border-[#f0d77c]/50 shadow-lg shadow-[#d4af37]/30'
                  }
                `}
              >
                <span className="text-xl uppercase tracking-widest font-semibold">{option}</span>
              </button>
            );
          })}
        </div>
      )}


    </div>
  );
}
