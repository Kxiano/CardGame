'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n, Locale } from '@/lib/i18n';
import { useSocket } from '@/lib/socket';
import { useSound } from '@/lib/sound';
import { useToast, PlayingCard, Modal, SoundToggle, LanguageSelector } from '@/components/ui';
import { getCurrentQuestion, getQuestionCount } from '@/lib/game-engine/questions';
import { Player, DrinkEvent } from '@/lib/game-engine/types';
import styles from './page.module.css';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const { t, locale } = useI18n();
  const {
    gameState,
    currentPlayer,
    isConnected,
    answerQuestion,
    callTruco,
    skipTruco,
    confirmTrucoPhase,
    revealPyramidCard,
    distributeDrinks,
    requestReplay,
    voteReplay,
    pendingDrink,
    clearPendingDrink,
    leaveRoom,
  } = useSocket();
  const { playSound } = useSound();
  const { showToast, showDrinkToast } = useToast();

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Play sound when pendingDrink changes
  useEffect(() => {
    if (pendingDrink) {
      playSound('drink');
    }
  }, [pendingDrink, playSound]);

  const handleConfirmDrink = () => {
    clearPendingDrink();
  };

  // Handle replay request
  useEffect(() => {
    if (gameState?.dealerAskedReplay) {
      setShowReplayModal(true);
    }
  }, [gameState?.dealerAskedReplay]);

  // Handle phase changes
  useEffect(() => {
    if (gameState?.phase === 'lobby') {
      router.push(`/lobby/${roomId}`);
    }
  }, [gameState?.phase, roomId, router]);

  const currentQuestion = useMemo(() => {
    if (!gameState || gameState.phase !== 'questions') return null;
    return getCurrentQuestion(gameState.difficulty, gameState.currentQuestionIndex);
  }, [gameState]);

  const questionCount = useMemo(() => {
    if (!gameState) return 0;
    return getQuestionCount(gameState.difficulty);
  }, [gameState]);

  const isMyTurn = useMemo(() => {
    if (!gameState || !currentPlayer) return false;
    const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentTurnPlayer?.id === currentPlayer.id;
  }, [gameState, currentPlayer]);

  const currentTurnPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex];
  }, [gameState]);

  const handleAnswer = (answer: string) => {
    playSound('click');
    answerQuestion(answer);
  };

  const handleCallTruco = () => {
    playSound('truco');
    callTruco();
  };

  const handleSkipTruco = () => {
    playSound('click');
    skipTruco();
  };

  const handleConfirmTruco = () => {
    playSound('click');
    confirmTrucoPhase();
  };

  const handleRevealCard = () => {
    playSound('cardFlip');
    revealPyramidCard();
  };

  const handleDistribute = () => {
    if (selectedPlayers.length === 0 || !currentPlayer) return;
    playSound('click');
    distributeDrinks(selectedPlayers, currentPlayer.drinksToDistribute);
    setSelectedPlayers([]);
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleRequestReplay = () => {
    playSound('click');
    requestReplay();
  };

  const handleVoteReplay = (vote: boolean) => {
    playSound('click');
    voteReplay(vote);
    setHasVoted(true);
  };

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
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
  const sortedLeaderboard = [...gameState.players].sort((a, b) => b.drinks - a.drinks);

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.phase}>
            {gameState.phase === 'questions' && t('game.questionPhase')}
            {gameState.phase === 'revelation' && t('game.revelationPhase')}
            {gameState.phase === 'ended' && t('endGame.title')}
          </span>
        </div>
        <div className={styles.headerRight}>
          <SoundToggle />
          <LanguageSelector />
        </div>
      </header>

      <div className={`${styles.gameArea} ${gameState.phase === 'questions' ? styles.questionsPhase : ''} ${gameState.phase === 'revelation' ? styles.revelationPhase : ''}`}>
        {/* Left Panel - Player Hands */}
        <aside className={styles.playersPanel}>
          <h3 className={styles.panelTitle}>{t('game.otherPlayers')}</h3>
          <div className={styles.playersList}>
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`${styles.playerCard} ${
                  currentTurnPlayer?.id === player.id ? styles.currentTurn : ''
                } ${
                  selectedPlayers.includes(player.id) ? styles.selected : ''
                }`}
                onClick={() => {
                  if (currentPlayer?.drinksToDistribute && player.id !== currentPlayer.id) {
                    togglePlayerSelection(player.id);
                  }
                }}
              >
                <div className={styles.playerHeader}>
                  <div className="player-avatar">
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      {player.nickname}
                      {player.id === currentPlayer?.id && ' (You)'}
                    </span>
                    <div className={styles.playerStats}>
                      <span className="drink-counter">🍺 {player.drinks}</span>
                      {player.drinksToDistribute > 0 && (
                        <span className={styles.toDistribute}>
                          🎁 {player.drinksToDistribute}
                        </span>
                      )}
                    </div>
                  </div>
                  {player.isDealer && (
                    <span className="badge badge-dealer">{t('common.dealer')}</span>
                  )}
                </div>
                {/* Show all players' hands */}
                <div className={styles.playerHand}>
                  {player.hand.map((card) => (
                    <PlayingCard key={card.id} card={card} size="sm" />
                  ))}
                  {player.hand.length === 0 && (
                    <span className={styles.noCards}>No cards yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center - Game Table */}
        <div className={styles.tableArea}>
          {/* Pyramid */}
          <div className={styles.pyramidSection}>
            <div className={styles.pyramid}>
              {gameState.pyramid.slice().reverse().map((row, reversedIdx) => {
                const rowIdx = gameState.pyramid.length - 1 - reversedIdx;
                const isTopRow = row.rowNumber === 5;
                const unrevealedCount = row.cards.filter(c => !c.faceUp).length;
                const revealedCards = row.cards.filter(c => c.faceUp);
                
                return (
                  <div key={row.rowNumber} className={styles.pyramidRow}>
                    <span className={styles.rowLabel}>
                      {row.isDistribute ? '🎁' : '🍺'} x{row.drinkMultiplier}
                    </span>
                    <div className={styles.rowCards}>
                      {/* Show revealed cards normally */}
                      {revealedCards.map((card) => (
                        <PlayingCard
                          key={card.id}
                          card={card}
                          size="md"
                        />
                      ))}
                      {/* For top row with many cards, show stacked with counter */}
                      {isTopRow && unrevealedCount > 1 ? (
                        <div className={styles.stackedCards}>
                          <PlayingCard
                            card={{ id: 'stack', suit: 'spades', value: 1, faceUp: false }}
                            size="md"
                            highlighted={
                              gameState.phase === 'revelation' &&
                              rowIdx === gameState.currentPyramidRow
                            }
                          />
                          <span className={styles.stackCount}>x{unrevealedCount}</span>
                        </div>
                      ) : (
                        /* Show unrevealed cards normally for other rows */
                        row.cards.filter(c => !c.faceUp).map((card, cardIdx) => {
                          const actualCardIdx = row.cards.indexOf(card);
                          return (
                            <PlayingCard
                              key={card.id}
                              card={card}
                              size="md"
                              highlighted={
                                gameState.phase === 'revelation' &&
                                rowIdx === gameState.currentPyramidRow &&
                                actualCardIdx === gameState.currentPyramidCard
                              }
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Phase */}
          {gameState.phase === 'questions' && currentQuestion && (
            <div className={styles.questionSection}>
              <div className={styles.questionInfo}>
                <span className={styles.questionNumber}>
                  {t('game.question', {
                    current: gameState.currentQuestionIndex + 1,
                    total: questionCount,
                  })}
                </span>
                {isMyTurn ? (
                  <span className={styles.yourTurn}>{t('game.yourTurn')}</span>
                ) : (
                  <span className={styles.waiting}>
                    {t('game.waitingFor', { name: currentTurnPlayer?.nickname || '' })}
                  </span>
                )}
              </div>

              <p className={styles.questionText}>
                {currentQuestion.text[locale as keyof typeof currentQuestion.text] || currentQuestion.text.en}
              </p>

              {isMyTurn && !gameState.awaitingTruco && (
                <div className={styles.answerButtons}>
                  {(currentQuestion.options[locale as keyof typeof currentQuestion.options] || currentQuestion.options.en).map((option) => (
                    <button
                      key={option}
                      className="btn btn-primary"
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Last Answer Display - only show card after Truco phase */}
              {gameState.lastAnswer && !gameState.awaitingTruco && (
                <div className={`${styles.lastAnswer} ${gameState.lastAnswer.correct ? styles.correct : styles.incorrect}`}>
                  <p>
                    <strong>{gameState.lastAnswer.playerName}</strong> answered: {gameState.lastAnswer.answer}
                  </p>
                  {gameState.lastAnswer.card && gameState.lastAnswer.card.faceUp && (
                    <div className={styles.revealedCard}>
                      <PlayingCard card={gameState.lastAnswer.card} size="lg" />
                    </div>
                  )}
                  <p className={styles.answerResult}>
                    {gameState.lastAnswer.correct ? '✓ Correct!' : '✗ Wrong!'}
                  </p>
                </div>
              )}

              {/* Truco Waiting Phase - show answer but not card/result */}
              {gameState.awaitingTruco && gameState.lastAnswer && (
                <div className={styles.trucoWaiting}>
                  <p>
                    <strong>{gameState.lastAnswer.playerName}</strong> answered: {gameState.lastAnswer.answer}
                  </p>
                  <p className={styles.waitingForTruco}>Choose: Call Truco! or Pass</p>
                </div>
              )}

              {/* Truco Phase - Voting */}
              {gameState.awaitingTruco && (
                <div className={styles.trucoSection}>
                  {/* Show buttons only if current player hasn't decided and it's not their turn */}
                  {!isMyTurn && gameState.trucoEnabled && 
                   !gameState.trucoVotes.some(v => v.playerId === currentPlayer?.id) &&
                   !gameState.trucoSkips?.includes(currentPlayer?.id || '') && (
                    <div className={styles.trucoButtons}>
                      <button
                        className={`btn btn-danger btn-lg ${styles.trucoButton}`}
                        onClick={handleCallTruco}
                      >
                        🔥 {t('game.truco')}
                      </button>
                      <button
                        className="btn btn-secondary btn-lg"
                        onClick={handleSkipTruco}
                      >
                        ✓ Pass
                      </button>
                    </div>
                  )}
                  
                  {/* Show decision made */}
                  {!isMyTurn && (gameState.trucoVotes.some(v => v.playerId === currentPlayer?.id) ||
                   gameState.trucoSkips?.includes(currentPlayer?.id || '')) && (
                    <p className={styles.decisionMade}>
                      {gameState.trucoVotes.some(v => v.playerId === currentPlayer?.id) 
                        ? '🔥 You called Truco!'
                        : '✓ You passed'
                      }
                    </p>
                  )}
                  
                  {/* Show Truco calls */}
                  {gameState.trucoVotes.length > 0 && (
                    <div className={styles.trucoVotes}>
                      {gameState.trucoVotes.map(vote => (
                        <span key={vote.playerId} className={styles.trucoVote}>
                          {t('game.trucoCalled', { name: vote.playerName })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Revelation Phase */}
          {gameState.phase === 'revelation' && (
            <div className={styles.revelationSection}>
              <h3>{t('game.revelationPhase')}</h3>
              
              {gameState.revealedCard && (
                <div className={styles.revealedCard}>
                  <PlayingCard card={gameState.revealedCard} size="lg" />
                </div>
              )}

              {isDealer && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleRevealCard}
                >
                  {t('game.revealCard')}
                </button>
              )}

              {/* Distribute Drinks */}
              {currentPlayer && currentPlayer.drinksToDistribute > 0 && (
                <div className={styles.distributeSection}>
                  <p className={styles.distributeMessage}>
                    {t('game.youHaveDrinks', { count: currentPlayer.drinksToDistribute })}
                  </p>
                  <p className="text-muted">{t('game.selectPlayer')}</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleDistribute}
                    disabled={selectedPlayers.length === 0}
                  >
                    {t('game.giveDrinks')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Game Ended */}
          {gameState.phase === 'ended' && (
            <div className={styles.endSection}>
              <h2 className={styles.endTitle}>{t('endGame.title')}</h2>
              
              {isDealer && !gameState.dealerAskedReplay && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleRequestReplay}
                >
                  {t('endGame.playAgain')}
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={handleLeave}
              >
                {t('endGame.backToHome')}
              </button>
            </div>
          )}
        </div>

        {/* Show Leaderboard only at game end */}
        {gameState.phase === 'ended' && (
          <aside className={styles.leaderboardPanel}>
            <h3 className={styles.panelTitle}>{t('game.leaderboard')}</h3>
            <div className={styles.leaderboard}>
              {sortedLeaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className={`leaderboard-item ${
                    index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''
                  }`}
                >
                  <div className={styles.leaderboardPlayer}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.leaderboardName}>{player.nickname}</span>
                  </div>
                  <span className="drink-counter">🍺 {player.drinks}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Drink Notification Overlay */}
      {pendingDrink && (
        <div className={styles.drinkOverlay}>
          <div className={styles.drinkContent}>
            <div className={styles.drinkEmoji}>🍺</div>
            {/* Show the revealed card if present */}
            {pendingDrink.card && (
              <div className={styles.drinkCardPreview}>
                <PlayingCard
                  card={{...pendingDrink.card, faceUp: true}}
                  size="md"
                />
              </div>
            )}
            <div className={styles.drinkAmount}>{pendingDrink.amount}</div>
            <div className={styles.drinkLabel}>
              {pendingDrink.amount === 1 
                ? t('notifications.drinkSingular') 
                : t('notifications.drinkPlural')}
            </div>
            <p className={styles.drinkReason}>
              {(() => {
                const reason = pendingDrink.reason;
                if (reason.includes('Truco backfired')) {
                  return t('notifications.trucoBackfired');
                } else if (reason.includes('incorrectly')) {
                  return t('notifications.youAnsweredIncorrectly');
                } else if (reason.includes('answered correctly')) {
                  return t('notifications.othersAnsweredCorrectly');
                } else if (reason.includes('sharing the love')) {
                  return t('notifications.sharingDrinks');
                } else if (reason.includes('Matched card')) {
                  return t('notifications.matchedCard');
                } else if (reason.includes('No matches')) {
                  return t('notifications.noMatches');
                }
                return reason;
              })()}
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleConfirmDrink}
            >
              {t('notifications.drinkConfirm')}
            </button>
          </div>
        </div>
      )}

      {/* Replay Vote Modal */}
      <Modal
        isOpen={showReplayModal && !hasVoted}
        title={t('endGame.playAgain')}
        showCloseButton={false}
        size="sm"
      >
        <div className={styles.voteModal}>
          <p>{t('endGame.waitingForVotes')}</p>
          <div className={styles.voteButtons}>
            <button
              className="btn btn-success btn-lg"
              onClick={() => handleVoteReplay(true)}
            >
              {t('common.yes')}
            </button>
            <button
              className="btn btn-danger btn-lg"
              onClick={() => handleVoteReplay(false)}
            >
              {t('common.no')}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
