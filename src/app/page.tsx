'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSocket } from '@/lib/socket';
import { useSound } from '@/lib/sound';
import { LanguageSelector, SoundToggle, Modal } from '@/components/ui';
import { LobbyInfo } from '@/lib/game-engine/types';

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const { createRoom, joinRoom, isConnected, error, clearError, getOpenLobbies, onLobbiesUpdate } = useSocket();
  const { playSound } = useSound();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');

  // Load persisted nickname on mount
  useEffect(() => {
    const savedNickname = localStorage.getItem('xerekinha-nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  // Save nickname to localStorage when it changes
  function handleNicknameChange(value: string) {
    setNickname(value);
    if (value.trim()) {
      localStorage.setItem('xerekinha-nickname', value);
    }
  }

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

  async function handleCreateRoom() {
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
  }

  async function handleJoinRoom() {
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
  }

  async function handleQuickJoin(lobbyRoomId: string) {
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
  }

  function handleOpenJoinModal() {
    playSound('click');
    setShowJoinModal(true);
    setLocalError('');
  }

  function handleCloseJoinModal() {
    setShowJoinModal(false);
    setRoomCode('');
    setLocalError('');
  }

  function handleOpenBrowseModal() {
    playSound('click');
    setShowBrowseModal(true);
    setLocalError('');
  }

  function handleCloseBrowseModal() {
    setShowBrowseModal(false);
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorative cards */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] -rotate-[15deg] text-white text-[15rem] sm:text-[10rem] opacity-[0.03] font-bold">♠</div>
        <div className="absolute top-[10%] right-[-10%] rotate-[20deg] text-card-red text-[15rem] sm:text-[10rem] opacity-[0.03] font-bold">♥</div>
        <div className="absolute bottom-[10%] left-[5%] -rotate-[25deg] text-card-red text-[15rem] sm:text-[10rem] opacity-[0.03] font-bold">♦</div>
        <div className="absolute bottom-[-10%] right-[5%] rotate-[30deg] text-white text-[15rem] sm:text-[10rem] opacity-[0.03] font-bold">♣</div>
      </div>

      {/* Header with settings */}
      <header className="flex justify-between items-center px-6 py-4 relative z-10">
        <div className="flex gap-3">
          <SoundToggle />
        </div>
        <div className="flex gap-3">
          <LanguageSelector />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 gap-8">
        <div className="text-center">
          <h1 className="text-6xl sm:text-4xl font-black bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent mb-2 -tracking-[2px]">
            {t('home.title')}
          </h1>
          <p className="text-xl sm:text-base text-white/70 m-0">{t('home.subtitle')}</p>
          <p className="inline-block mt-4 px-4 py-1.5 bg-gold/15 border border-gold/30 rounded-full text-gold text-sm font-semibold">
            {t('home.playerCount')}
          </p>
        </div>

        {/* Nickname input */}
        <div className="w-full max-w-[320px]">
          <input
            type="text"
            className="input text-center text-lg"
            placeholder={t('home.enterNickname')}
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            maxLength={15}
          />
        </div>

        {/* Main buttons */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[320px]">
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleCreateRoom}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? t('common.loading') : t('home.createRoom')}
          </button>

          <button
            className="btn btn-secondary btn-lg w-full"
            onClick={handleOpenJoinModal}
            disabled={isLoading || !isConnected}
          >
            {t('home.joinRoom')}
          </button>

          <button
            className="btn btn-success btn-lg w-full"
            onClick={handleOpenBrowseModal}
            disabled={isLoading || !isConnected}
          >
            🎮 {t('home.browseGames')}
          </button>

          <button
            className="btn btn-secondary mt-4"
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
          <p className="text-white/50 text-sm animate-pulse">
            Connecting to server...
          </p>
        )}

        {/* Local error */}
        {localError && (
          <p className="text-danger text-sm text-center px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg w-full max-w-[320px]">
            {localError}
          </p>
        )}
      </div>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={handleCloseJoinModal}
        title={t('home.joinRoom')}
        size="md"
      >
        <div className="flex flex-col gap-4">
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
            <p className="text-danger text-sm text-center px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg">
              {localError}
            </p>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <button
              className="btn btn-secondary min-w-[100px]"
              onClick={handleCloseJoinModal}
            >
              {t('home.cancel')}
            </button>
            <button
              className="btn btn-primary min-w-[100px]"
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
        <div className="min-h-[200px]">
          {lobbies.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-white/70 text-center">
              <p>🎲 {t('home.noLobbiesAvailable')}</p>
              <p className="text-sm text-white/50 mt-2">{t('home.createYourOwn')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {lobbies.map((lobby) => (
                <div
                  key={lobby.roomId}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl transition-all duration-200 hover:bg-white/10 hover:border-gold/30"
                >
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="font-semibold text-white">{lobby.hostName}</span>
                    <span className="text-xs text-white/50 font-mono">{lobby.roomId}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <span className="text-white/80">
                      👥 {lobby.playerCount}/{lobby.maxPlayers}
                    </span>
                    <span className="text-xs text-white/60 capitalize">
                      {lobby.difficulty === 'easy' ? '🟢' : lobby.difficulty === 'normal' ? '🟡' : '🔴'} {lobby.difficulty}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm min-w-[80px]"
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
