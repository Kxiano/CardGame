'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSocket } from '@/lib/socket';
import { useSound } from '@/lib/sound';
import { useToast, LanguageSelector, SoundToggle } from '@/components/ui';
import { Difficulty } from '@/lib/game-engine/types';
import styles from './page.module.css';

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
    error 
  } = useSocket();
  const { playSound } = useSound();
  const { showToast } = useToast();
  
  const [copied, setCopied] = useState(false);

  // Redirect to game when phase changes
  useEffect(() => {
    if (gameState?.phase === 'questions' || gameState?.phase === 'revelation') {
      playSound('bell');
      router.push(`/game/${roomId}`);
    }
  }, [gameState?.phase, roomId, router, playSound]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      playSound('click');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleLeave = () => {
    playSound('click');
    leaveRoom();
    router.push('/');
  };

  const handleToggleReady = () => {
    playSound('click');
    setReady(!currentPlayer?.isReady);
  };

  const handleStartGame = () => {
    playSound('bell');
    startGame();
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    playSound('click');
    setDifficulty(difficulty);
  };

  const handleTrucoToggle = () => {
    playSound('click');
    setTruco(!gameState?.trucoEnabled);
  };

  if (!isConnected || !gameState) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const isDealer = currentPlayer?.isDealer;
  const allReady = gameState.players.every(p => p.isReady);
  const canStart = isDealer && allReady && gameState.players.length >= 2;

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
          ← {t('lobby.leave')}
        </button>
        <div className={styles.headerRight}>
          <SoundToggle />
          <LanguageSelector />
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.container}>
          {/* Room Info */}
          <div className={styles.roomInfo}>
            <h1 className={styles.title}>{t('lobby.title')}</h1>
            
            <div className={styles.roomCode}>
              <span className={styles.roomCodeLabel}>{t('lobby.roomCode')}</span>
              <div className={styles.roomCodeValue}>
                <span className={styles.code}>{roomId}</span>
                <button 
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopyCode}
                >
                  {copied ? t('lobby.copied') : t('lobby.copyCode')}
                </button>
              </div>
            </div>

            {isDealer && (
              <span className={`badge badge-dealer ${styles.dealerBadge}`}>
                {t('lobby.youAreDealer')}
              </span>
            )}
          </div>

          <div className={styles.grid}>
            {/* Players List */}
            <section className={`glass-panel ${styles.section}`}>
              <h2 className={styles.sectionTitle}>
                {t('lobby.players')} ({gameState.players.length}/10)
              </h2>
              
              <div className={styles.playersList}>
                {gameState.players.map((player) => (
                  <div 
                    key={player.id} 
                    className={`player-item ${player.id === currentPlayer?.id ? styles.currentPlayer : ''}`}
                  >
                    <div className="player-avatar">
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.playerInfo}>
                      <span className={styles.playerName}>
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
                  className={`btn ${currentPlayer?.isReady ? 'btn-danger' : 'btn-success'} w-full`}
                  onClick={handleToggleReady}
                  style={{ marginTop: '16px' }}
                >
                  {currentPlayer?.isReady ? t('lobby.notReady') : t('lobby.ready')}
                </button>
              )}
            </section>

            {/* Settings (Dealer Only) */}
            <section className={`glass-panel ${styles.section}`}>
              <h2 className={styles.sectionTitle}>{t('lobby.settings')}</h2>
              
              {/* Difficulty */}
              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>{t('lobby.difficulty')}</label>
                <div className={styles.difficultyButtons}>
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
                <p className={styles.settingDescription}>
                  {gameState.difficulty === 'easy' && '3 questions per round'}
                  {gameState.difficulty === 'normal' && '5 questions per round'}
                  {gameState.difficulty === 'hard' && '7 questions per round'}
                </p>
              </div>

              {/* Truco Rule */}
              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>{t('lobby.trucoRule')}</label>
                <button
                  className={`btn ${gameState.trucoEnabled ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleTrucoToggle}
                  disabled={!isDealer}
                >
                  {gameState.trucoEnabled ? t('lobby.enabled') : t('lobby.disabled')}
                </button>
                <p className={styles.settingDescription}>
                  Allows players to bet against answers
                </p>
              </div>

              {/* Start Game Button */}
              {isDealer && (
                <div className={styles.startSection}>
                  <button
                    className="btn btn-primary btn-lg w-full"
                    onClick={handleStartGame}
                    disabled={!canStart}
                  >
                    {t('lobby.startGame')}
                  </button>
                  {!allReady && (
                    <p className={styles.waitingMessage}>{t('lobby.waitingForReady')}</p>
                  )}
                  {gameState.players.length < 2 && (
                    <p className={styles.waitingMessage}>Need at least 2 players</p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
