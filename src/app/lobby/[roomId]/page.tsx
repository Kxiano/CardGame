'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSocket } from '@/lib/socket';
import { useSound } from '@/lib/sound';
import { useToast, LanguageSelector, SoundToggle } from '@/components/ui';
import { Difficulty } from '@/lib/game-engine/types';

export default function LobbyPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const { t } = useI18n();
  const {
    gameState,
    currentPlayer,
    isConnected,
    leaveRoom,
    setReady,
    setDifficulty,
    setTruco,
    startGame,
    reorderPlayers,
    error
  } = useSocket();
  const { playSound } = useSound();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Navigate with fade-out transition
  function navigateToGame() {
    setIsFadingOut(true);
    setTimeout(() => {
      router.push(`/game/${roomId}`);
    }, 500); // Wait for fade-out animation
  }

  // Redirect to game when phase changes (with animation)
  useEffect(() => {
    if (gameState?.phase === 'questions' || gameState?.phase === 'revelation') {
      // Show animation first
      setShowStartAnimation(true);
      playSound('bell');

      // Wait for video to finish (or timeout after 4s), then navigate with fade
      const timeout = setTimeout(() => {
        navigateToGame();
      }, 4000); // 4 second max wait

      return () => clearTimeout(timeout);
    }
  }, [gameState?.phase, roomId, router, playSound]);

  // Handle video end - navigate with fade immediately
  function handleVideoEnd() {
    navigateToGame();
  }

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      playSound('click');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  }

  function handleLeave() {
    playSound('click');
    leaveRoom();
    router.push('/');
  }

  function handleToggleReady() {
    playSound('ready');
    setReady(!currentPlayer?.isReady);
  }

  function handleStartGame() {
    playSound('bell');
    startGame();
  }

  function handleDifficultyChange(difficulty: Difficulty) {
    playSound('click');
    setDifficulty(difficulty);
  }

  function handleTrucoToggle() {
    playSound('click');
    setTruco(!gameState?.trucoEnabled);
  }

  function handleReorder(index: number, direction: 'up' | 'down') {
    console.log('handleReorder called', { index, direction, gameState });
    if (!gameState) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    console.log('Calculated newIndex:', newIndex);

    if (newIndex >= 0 && newIndex < gameState.players.length) {
      console.log('Valid move, calling reorderPlayers', { index, newIndex });
      playSound('click');
      reorderPlayers(index, newIndex);
    } else {
      console.log('Invalid move', { newIndex, totalPlayers: gameState.players.length });
    }
  }

  if (!isConnected || !gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-white/10 border-t-gold rounded-full animate-spin"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const isDealer = currentPlayer?.isDealer;
  const allReady = gameState.players.every(p => p.isReady);
  const canStart = isDealer && allReady && gameState.players.length >= 2;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4">
        <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
          ← {t('lobby.leave')}
        </button>
        <div className="flex gap-3">
          <SoundToggle />
          <LanguageSelector />
        </div>
      </header>

      <div className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-[900px]">
          {/* Room Info */}
          <div className="text-center mb-8 flex flex-col items-center">
            <h1 className="text-3xl mb-4 text-gold">{t('lobby.title')}</h1>

            <div className="inline-flex flex-col items-center gap-2 px-6 py-4 bg-black/30 rounded-xl mb-4">
              <span className="text-sm text-white/60">{t('lobby.roomCode')}</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold tracking-[4px] text-white font-mono">{roomId}</span>
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopyCode}
                >
                  {copied ? t('lobby.copied') : t('lobby.copyCode')}
                </button>
              </div>
            </div>

            {isDealer && (
              <span className="badge badge-dealer text-sm px-3 py-1 self-center">
                {t('lobby.youAreDealer')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Players List */}
            <section className="glass-panel p-6">
              <h2 className="text-xl mb-4 text-gold">
                {t('lobby.players')} ({gameState.players.length}/10)
              </h2>

              <div className="flex flex-col gap-2">
                {gameState.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`player-item relative ${player.id === currentPlayer?.id ? 'border border-gold/50' : ''}`}
                  >
                    {/* Reorder Buttons (Dealer Only) */}
                    {isDealer && gameState.players.length > 1 && (
                      <div className="flex flex-col mr-2 gap-0.5">
                        <button
                          className="px-1 py-0 text-xs leading-none min-h-0"
                          onClick={() => handleReorder(index, 'up')}
                          disabled={index === 0}
                          style={{ visibility: index === 0 ? 'hidden' : 'visible' }}
                        >
                          ▲
                        </button>
                        <button
                          className="px-1 py-0 text-xs leading-none min-h-0"
                          onClick={() => handleReorder(index, 'down')}
                          disabled={index === gameState.players.length - 1}
                          style={{ visibility: index === gameState.players.length - 1 ? 'hidden' : 'visible' }}
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    <div className="player-avatar">
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="font-semibold">
                        {player.nickname}
                        {player.id === currentPlayer?.id && ' (You)'}
                      </span>
                      {player.isDealer && (
                        <span className="badge badge-dealer">{t('common.dealer')}</span>
                      )}
                    </div>
                    <span className={`badge ${player.isReady ? 'badge-ready' : 'badge-waiting'}`}>
                      {player.isReady ? t('lobby.ready') : t('lobby.notReady')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ready Button */}
              {!isDealer && (
                <button
                  className={`btn ${currentPlayer?.isReady ? 'btn-danger' : 'btn-success'} w-full mt-4`}
                  onClick={handleToggleReady}
                >
                  {currentPlayer?.isReady ? t('lobby.notReady') : t('lobby.ready')}
                </button>
              )}
            </section>

            {/* Settings (Dealer Only) */}
            <section className="glass-panel p-6">
              <h2 className="text-xl mb-4 text-gold">{t('lobby.settings')}</h2>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block font-semibold mb-2 text-white/90">{t('lobby.difficulty')}</label>
                <div className="flex gap-2">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      className={`btn btn-sm ${gameState.difficulty === diff ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleDifficultyChange(diff)}
                      disabled={!isDealer}
                    >
                      {t(`lobby.${diff}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  {gameState.difficulty === 'easy' && '3 questions per round'}
                  {gameState.difficulty === 'normal' && '5 questions per round'}
                  {gameState.difficulty === 'hard' && '7 questions per round'}
                </p>
              </div>

              {/* Truco Rule */}
              <div className="mb-6">
                <label className="block font-semibold mb-2 text-white/90">{t('lobby.trucoRule')}</label>
                <button
                  className={`btn ${gameState.trucoEnabled ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleTrucoToggle}
                  disabled={!isDealer}
                >
                  {gameState.trucoEnabled ? t('lobby.enabled') : t('lobby.disabled')}
                </button>
                <p className="text-xs text-white/50 mt-2">
                  Allows players to bet against answers
                </p>
              </div>

              {/* Start Game Button */}
              {isDealer && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <button
                    className="btn btn-primary btn-lg w-full"
                    onClick={handleStartGame}
                    disabled={!canStart}
                  >
                    {t('lobby.startGame')}
                  </button>
                  {!allReady && (
                    <p className="text-center text-white/50 text-sm mt-3">{t('lobby.waitingForReady')}</p>
                  )}
                  {gameState.players.length < 2 && (
                    <p className="text-center text-white/50 text-sm mt-3">Need at least 2 players</p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Game Start Animation Overlay */}
      {showStartAnimation && (
        <div className={`fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[9999] ${isFadingOut ? 'animate-[fadeOut_0.5s_ease_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}>
          <video
            ref={videoRef}
            src="/animations/game-start.webm"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="max-w-[80%] max-h-[70vh] rounded-2xl shadow-[0_0_60px_rgba(212,175,55,0.4)]"
          />
        </div>
      )}
    </main>
  );
}
