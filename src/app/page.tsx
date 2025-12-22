'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSocket } from '@/lib/socket';
import { useSound } from '@/lib/sound';
import { LanguageSelector, SoundToggle, Modal } from '@/components/ui';
import { LobbyInfo } from '@/lib/game-engine/types';
import styles from './page.module.css';

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const { createRoom, joinRoom, isConnected, error, clearError, getOpenLobbies, onLobbiesUpdate } = useSocket();
  const { playSound } = useSound();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [lobbies, setLobbies] = useState<LobbyInfo[]>([]);

  // Fetch lobbies when browse modal opens
  useEffect(() => {
    if (showBrowseModal) {
      getOpenLobbies().then(setLobbies);
    }
  }, [showBrowseModal, getOpenLobbies]);

  // Listen for real-time lobby updates
  useEffect(() => {
    if (!showBrowseModal) return;
    
    const unsubscribe = onLobbiesUpdate((updatedLobbies) => {
      setLobbies(updatedLobbies);
    });
    
    return unsubscribe;
  }, [showBrowseModal, onLobbiesUpdate]);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setLocalError('Please enter a nickname');
      return;
    }
    
    playSound('click');
    setIsLoading(true);
    setLocalError('');
    
    const roomId = await createRoom(nickname.trim());
    
    if (roomId) {
      router.push(`/lobby/${roomId}`);
    } else {
      setLocalError(error || 'Failed to create room');
    }
    
    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }
    if (!nickname.trim()) {
      setLocalError('Please enter a nickname');
      return;
    }
    
    playSound('click');
    setIsLoading(true);
    setLocalError('');
    
    const success = await joinRoom(roomCode.trim().toUpperCase(), nickname.trim());
    
    if (success) {
      router.push(`/lobby/${roomCode.trim().toUpperCase()}`);
    } else {
      setLocalError(error || 'Failed to join room');
    }
    
    setIsLoading(false);
  };

  const handleQuickJoin = async (lobbyRoomId: string) => {
    if (!nickname.trim()) {
      setLocalError('Please enter a nickname first');
      setShowBrowseModal(false);
      return;
    }
    
    playSound('click');
    setIsLoading(true);
    setLocalError('');
    
    const success = await joinRoom(lobbyRoomId, nickname.trim());
    
    if (success) {
      router.push(`/lobby/${lobbyRoomId}`);
    } else {
      setLocalError(error || 'Failed to join room');
      setShowBrowseModal(false);
    }
    
    setIsLoading(false);
  };

  const handleOpenJoinModal = () => {
    playSound('click');
    setShowJoinModal(true);
    setLocalError('');
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setRoomCode('');
    setLocalError('');
  };

  const handleOpenBrowseModal = () => {
    playSound('click');
    setShowBrowseModal(true);
    setLocalError('');
  };

  const handleCloseBrowseModal = () => {
    setShowBrowseModal(false);
  };

  return (
    <main className={styles.main}>
      {/* Background decorative cards */}
      <div className={styles.bgCards}>
        <div className={`${styles.bgCard} ${styles.bgCard1}`}>♠</div>
        <div className={`${styles.bgCard} ${styles.bgCard2}`}>♥</div>
        <div className={`${styles.bgCard} ${styles.bgCard3}`}>♦</div>
        <div className={`${styles.bgCard} ${styles.bgCard4}`}>♣</div>
      </div>

      {/* Header with settings */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <SoundToggle />
        </div>
        <div className={styles.headerRight}>
          <LanguageSelector />
        </div>
      </header>

      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.logo}>
          <h1 className={styles.title}>{t('home.title')}</h1>
          <p className={styles.subtitle}>{t('home.subtitle')}</p>
          <p className={styles.playerCount}>{t('home.playerCount')}</p>
        </div>

        {/* Nickname input */}
        <div className={styles.nicknameSection}>
          <input
            type="text"
            className={`input ${styles.nicknameInput}`}
            placeholder={t('home.enterNickname')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={15}
          />
        </div>

        {/* Main buttons */}
        <div className={styles.buttons}>
          <button 
            className={`btn btn-primary btn-lg ${styles.mainButton}`}
            onClick={handleCreateRoom}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? t('common.loading') : t('home.createRoom')}
          </button>
          
          <button 
            className={`btn btn-secondary btn-lg ${styles.mainButton}`}
            onClick={handleOpenJoinModal}
            disabled={isLoading || !isConnected}
          >
            {t('home.joinRoom')}
          </button>

          <button 
            className={`btn btn-success btn-lg ${styles.mainButton}`}
            onClick={handleOpenBrowseModal}
            disabled={isLoading || !isConnected}
          >
            🎮 {t('home.browseGames')}
          </button>
          
          <button 
            className={`btn btn-secondary ${styles.creditsButton}`}
            onClick={() => {
              playSound('click');
              router.push('/credits');
            }}
          >
            {t('home.credits')}
          </button>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <p className={styles.connectionStatus}>
            Connecting to server...
          </p>
        )}

        {/* Local error */}
        {localError && (
          <p className={styles.error}>{localError}</p>
        )}
      </div>

      {/* Join Room Modal */}
      <Modal 
        isOpen={showJoinModal} 
        onClose={handleCloseJoinModal}
        title={t('home.joinRoom')}
        size="sm"
      >
        <div className={styles.modalContent}>
          <input
            type="text"
            className="input"
            placeholder={t('home.enterRoomCode')}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
          />
          
          {localError && (
            <p className={styles.error}>{localError}</p>
          )}
          
          <div className={styles.modalButtons}>
            <button 
              className="btn btn-secondary"
              onClick={handleCloseJoinModal}
            >
              {t('home.cancel')}
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleJoinRoom}
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('home.join')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Browse Games Modal */}
      <Modal 
        isOpen={showBrowseModal} 
        onClose={handleCloseBrowseModal}
        title={t('home.browseGames')}
        size="md"
      >
        <div className={styles.browseContent}>
          {lobbies.length === 0 ? (
            <div className={styles.noLobbies}>
              <p>🎲 {t('home.noLobbiesAvailable')}</p>
              <p className={styles.noLobbiesHint}>{t('home.createYourOwn')}</p>
            </div>
          ) : (
            <div className={styles.lobbyList}>
              {lobbies.map((lobby) => (
                <div key={lobby.roomId} className={styles.lobbyCard}>
                  <div className={styles.lobbyInfo}>
                    <span className={styles.lobbyHost}>{lobby.hostName}</span>
                    <span className={styles.lobbyCode}>{lobby.roomId}</span>
                  </div>
                  <div className={styles.lobbyMeta}>
                    <span className={styles.lobbyPlayers}>
                      👥 {lobby.playerCount}/{lobby.maxPlayers}
                    </span>
                    <span className={styles.lobbyDifficulty}>
                      {lobby.difficulty === 'easy' ? '🟢' : lobby.difficulty === 'normal' ? '🟡' : '🔴'} {lobby.difficulty}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuickJoin(lobby.roomId)}
                    disabled={isLoading}
                  >
                    {t('home.join')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}
