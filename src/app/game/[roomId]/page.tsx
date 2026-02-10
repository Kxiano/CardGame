'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n, Locale } from '@/lib/i18n';
import { useSocket } from '@/lib/socket';
import { useSound } from '@/lib/sound';
import { useToast, PlayingCard, Modal } from '@/components/ui';
import { GameHeader, SwipeableDrawer } from '@/components/game';
import { useModalQueue } from '@/lib/modal';
import { SuccessModal, DrinkModal, OtherPlayerResultModal, GiftSelectionModal, NoMatchModal, PyramidMatchModal, OtherPlayerDrinkModal, GiftReceivedModal, OtherPlayerGiftingModal, SomeoneIsDrinkingModal } from '@/components/modals';
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
  const { enqueueModal, dismissModal, isModalOpen } = useModalQueue();

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  // New modal state for redesigned modals
  const [activeModal, setActiveModal] = useState<'success' | 'drink' | 'otherResult' | 'gift' | 'noMatch' | 'pyramidMatch' | 'otherPlayerDrink' | 'giftReceived' | 'otherPlayerGifting' | 'someoneIsDrinking' | null>(null);
  const [modalData, setModalData] = useState<{
    prediction?: string;
    result?: string;
    card?: DrinkEvent['card'] | null;
    playerName?: string;
    otherPlayers?: Player[];
    drinksToGive?: number;
    rowNumber?: number;
    matchingPlayerHand?: DrinkEvent['card'][];
  }>({});

  // Determine modal type based on pendingDrink
  useEffect(() => {
    if (!pendingDrink || !gameState) {
      setActiveModal(null);
      return;
    }

    const reason = pendingDrink.reason || '';
    const isWrongAnswer = reason.includes('answered incorrectly') || reason.includes('Wrong answer');
    const isOtherPlayerCorrect = reason.includes('answered correctly');
    const isGiftRow = reason.includes('gift Row');
    const isTrucoBackfired = reason.includes('Truco backfired');
    const isNoMatch = reason.includes('No matches');

    // Get last answer info for prediction/result display
    const lastAnswer = gameState.lastAnswer;
    const prediction = lastAnswer?.answer || '';
    const result = lastAnswer?.correct ? prediction : (prediction.toLowerCase() === 'even' ? 'Odd' : 'Even');
    const card = pendingDrink.card || lastAnswer?.card || null;

    // FIRST: Check for success type (you answered correctly!)
    if (pendingDrink.type === 'success') {
      // Get other players who will drink
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer?.id);
      setActiveModal('success');
      setModalData({
        prediction,
        result: prediction, // Correct answer means prediction = result
        card: card,
        otherPlayers: otherPlayers,
      });
    }
    // Notification type (someone else is drinking - spectator view)
    // Must be checked BEFORE reason-based checks since notification events also have "answered incorrectly" reason
    else if (pendingDrink.type === 'notification') {
      setActiveModal('someoneIsDrinking');
      setModalData({
        playerName: pendingDrink.sourcePlayerName || '',
        card: card,
      });
    }
    // Gift row - use GiftSelectionModal
    else if (isGiftRow) {
      setActiveModal('gift');
      setModalData({
        drinksToGive: pendingDrink.amount,
        card: card,
      });
    }
    // Wrong answer - you drink
    else if (isWrongAnswer || isTrucoBackfired) {
      setActiveModal('drink');
      setModalData({
        prediction,
        result,
        card: card,
      });
    }
    // Other player correct - you drink
    else if (isOtherPlayerCorrect) {
      setActiveModal('otherResult');
      setModalData({
        playerName: pendingDrink.sourcePlayerName || '',
        prediction,
        result,
        card: card,
      });
    }
    // No matches during pyramid revelation - you drink
    else if (isNoMatch) {
      setActiveModal('noMatch');
      setModalData({
        card: card,
      });
    }
    // Pyramid drink row match - check if reason is "Matched card in Row X!" (not gift row)
    else if (reason.includes('Matched card in Row') && !reason.includes('gift')) {
      // Extract row number from reason
      const rowMatch = reason.match(/Row (\d+)/);
      const rowNumber = rowMatch ? parseInt(rowMatch[1], 10) : 0;
      
      setActiveModal('pyramidMatch');
      setModalData({
        card: card,
        rowNumber: rowNumber,
      });
    }
    // Other player matched in drink row - notification for non-matching players
    else if (reason.includes('matched in drink Row')) {
      // Extract row number from reason
      const rowMatch = reason.match(/Row (\d+)/);
      const rowNumber = rowMatch ? parseInt(rowMatch[1], 10) : 0;
      
      // Find the matching player's hand if available
      const matchingPlayerName = pendingDrink.sourcePlayerName || '';
      const matchingPlayer = gameState.players.find(p => p.nickname === matchingPlayerName.split(' & ')[0]);
      
      setActiveModal('otherPlayerDrink');
      setModalData({
        card: card,
        rowNumber: rowNumber,
        playerName: matchingPlayerName,
        matchingPlayerHand: matchingPlayer?.hand || [],
      });
    }
    // Received drinks from gift row distribution
    else if (reason.includes('sharing the love')) {
      setActiveModal('giftReceived');
      setModalData({
        playerName: pendingDrink.sourcePlayerName || '',
        card: card,
      });
    }
    // Other player matched in gift row - they're choosing who to give drinks
    else if (reason.includes('getting excited')) {
      setActiveModal('otherPlayerGifting');
      setModalData({
        playerName: pendingDrink.sourcePlayerName || '',
        drinksToGive: pendingDrink.amount,
      });
    }
  }, [pendingDrink, gameState]);

  // Play sound when pendingDrink changes
  useEffect(() => {
    if (pendingDrink) {
      playSound('drink');
    }
  }, [pendingDrink, playSound]);

  const handleConfirmDrink = () => {
    setActiveModal(null);
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
      <GameHeader
        phase={gameState.phase as 'questions' | 'revelation' | 'ended'}
        roundNumber={gameState.currentQuestionIndex + 1}
        totalRounds={questionCount}
      />

      <div className={`${styles.gameArea} ${gameState.phase === 'questions' ? styles.questionsPhase : ''} ${gameState.phase === 'revelation' ? styles.revelationPhase : ''}`}>


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
                          size="xs"
                        />
                      ))}
                      {/* For top row with many cards, show stacked with counter */}
                      {isTopRow && unrevealedCount > 1 ? (
                        <div className={styles.stackedCards}>
                          <PlayingCard
                            card={{ id: 'stack', suit: 'spades', value: 1, faceUp: false }}
                            size="xs"
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
                              size="xs"
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
            <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4">
              {/* Current Turn Section */}
              <div className="text-center">
                <span className="text-sm text-white/50 uppercase tracking-wider">
                  Current Turn
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {currentTurnPlayer?.nickname || ''}
                </h2>
                {isMyTurn ? (
                  <span className="inline-block mt-2 px-3 py-1 bg-gold/20 text-gold text-sm font-semibold rounded-full">
                    {t('game.yourTurn')}
                  </span>
                ) : (
                  <span className="text-white/60 text-sm mt-2 block">
                    {t('game.waitingFor', { name: currentTurnPlayer?.nickname || '' })}
                  </span>
                )}
              </div>

              {/* Prediction Badge */}
              <div className="inline-block px-4 py-1.5 bg-gold/20 border border-gold/40 rounded-full">
                <span className="text-gold text-sm font-semibold uppercase tracking-wide">
                  {t('game.question', {
                    current: gameState.currentQuestionIndex + 1,
                    total: questionCount,
                  })}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-center">
                <h3 className="text-3xl font-black text-white">
                  {currentQuestion.text[locale as keyof typeof currentQuestion.text] || currentQuestion.text.en}
                </h3>
                <p className="text-white/60 text-sm mt-2">
                  Predict if the next card value is even or odd
                </p>
              </div>

              {/* Face-down Card Preview */}
              <div className="my-4">
                <PlayingCard
                  card={{ id: 'mystery', suit: 'spades', value: 1, faceUp: false }}
                  size="lg"
                />
              </div>

              {/* Answer Buttons */}
              {isMyTurn && !gameState.awaitingTruco && (
                <div className="flex gap-4 w-full">
                  {(currentQuestion.options[locale as keyof typeof currentQuestion.options] || currentQuestion.options.en).map((option, index) => {
                    const isEven = index === 0;
                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        className={`
                          flex-1 py-5 rounded-xl font-bold text-lg
                          transition-all duration-200
                          ${isEven
                            ? 'bg-[#1a5f3c] hover:bg-[#2d8a56] text-white border-2 border-[#2d8a56]'
                            : 'bg-gold hover:bg-gold-light text-gray-900'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl font-mono border border-current rounded px-2 py-0.5">
                            {isEven ? '2' : '1'}
                          </span>
                          <span className="uppercase tracking-wider">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Last Answer Display - only show card after Truco phase */}
              {gameState.lastAnswer && !gameState.awaitingTruco && (() => {
                // Translate the answer value
                const answerKey = gameState.lastAnswer.answer.toLowerCase() as string;
                const translatedAnswer = t(`answers.${answerKey}`) !== `answers.${answerKey}` 
                  ? t(`answers.${answerKey}`) 
                  : gameState.lastAnswer.answer;
                
                return (
                  <div className={`w-full p-4 rounded-xl border-2 text-center ${
                    gameState.lastAnswer.correct 
                      ? 'bg-success/20 border-success' 
                      : 'bg-danger/20 border-danger'
                  }`}>
                    <p className="text-white/90">
                      {t('game.playerAnswered', { 
                        name: gameState.lastAnswer.playerName, 
                        answer: translatedAnswer 
                      })}
                    </p>
                    {gameState.lastAnswer.card && gameState.lastAnswer.card.faceUp && (
                      <div className="flex justify-center my-3">
                        <PlayingCard card={gameState.lastAnswer.card} size="lg" />
                      </div>
                    )}
                    <p className={`font-bold text-lg ${
                      gameState.lastAnswer.correct ? 'text-success' : 'text-danger'
                    }`}>
                      {gameState.lastAnswer.correct ? t('game.correctResult') : t('game.wrongResult')}
                    </p>
                  </div>
                );
              })()}

              {/* Truco Waiting Phase - show answer but not card/result */}
              {gameState.awaitingTruco && gameState.lastAnswer && (() => {
                // Translate the answer value
                const answerKey = gameState.lastAnswer.answer.toLowerCase() as string;
                const translatedAnswer = t(`answers.${answerKey}`) !== `answers.${answerKey}` 
                  ? t(`answers.${answerKey}`) 
                  : gameState.lastAnswer.answer;
                
                return (
                  <div className="w-full p-4 rounded-xl bg-warning/20 border-2 border-warning text-center">
                    <p className="text-white/90">
                      {t('game.playerAnswered', { 
                        name: gameState.lastAnswer.playerName, 
                        answer: translatedAnswer 
                      })}
                    </p>
                    <p className="text-warning font-semibold mt-2 animate-pulse">
                      {t('game.chooseTruco')}
                    </p>
                  </div>
                );
              })()}

              {/* Truco Phase - Voting */}
              {gameState.awaitingTruco && (
                <div className="w-full text-center space-y-4">
                  {/* Show buttons only if current player hasn't decided and it's not their turn */}
                  {!isMyTurn && gameState.trucoEnabled && 
                   !gameState.trucoVotes.some(v => v.playerId === currentPlayer?.id) &&
                   !gameState.trucoSkips?.includes(currentPlayer?.id || '') && (
                    <div className="flex gap-4 justify-center">
                      <button
                        className="flex-1 max-w-[140px] py-4 px-6 rounded-xl font-bold text-lg bg-danger hover:bg-danger/80 text-white transition-all"
                        onClick={handleCallTruco}
                      >
                        🔥 {t('game.truco')}
                      </button>
                      <button
                        className="flex-1 max-w-[140px] py-4 px-6 rounded-xl font-bold text-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                        onClick={handleSkipTruco}
                      >
                        ✓ Pass
                      </button>
                    </div>
                  )}
                  
                  {/* Show decision made */}
                  {!isMyTurn && (gameState.trucoVotes.some(v => v.playerId === currentPlayer?.id) ||
                   gameState.trucoSkips?.includes(currentPlayer?.id || '')) && (
                    <p className="text-lg font-semibold text-white/80">
                      {gameState.trucoVotes.some(v => v.playerId === currentPlayer?.id) 
                        ? '🔥 You called Truco!'
                        : '✓ You passed'
                      }
                    </p>
                  )}
                  
                  {/* Show Truco calls */}
                  {gameState.trucoVotes.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {gameState.trucoVotes.map(vote => (
                        <span key={vote.playerId} className="px-3 py-1 bg-danger/30 border border-danger rounded-full text-danger text-sm font-semibold">
                          {t('game.trucoCalled', { name: vote.playerName })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Revelation Phase - Revealed Card & Button */}
          {gameState.phase === 'revelation' && (
            <div className="flex flex-col items-center gap-2 w-full px-2 py-1 flex-shrink-0">
              {/* Currently Revealed Card */}
              {gameState.revealedCard && (
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                  <span className="text-xs text-white/50 uppercase tracking-wider text-center pb-4">
                    Revealed Card
                  </span>
                  <div className="flex justify-center w-full">
                    <PlayingCard card={gameState.revealedCard} size="sm" />
                  </div>
                </div>
              )}

              {/* Dealer Reveal Button */}
              {isDealer && (
                <button
                  className="px-6 py-3 rounded-xl font-bold text-base text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg"
                  onClick={handleRevealCard}
                >
                  {t('game.revealCard')}
                </button>
              )}

              {/* Distribute Drinks */}
              {currentPlayer && currentPlayer.drinksToDistribute > 0 && (
                <div className="w-full p-4 rounded-xl bg-gold/20 border-2 border-gold text-center space-y-3">
                  <p className="text-gold text-xl font-bold">
                    🎁 {t('game.youHaveDrinks', { count: currentPlayer.drinksToDistribute })}
                  </p>
                  <p className="text-white/60 text-sm">{t('game.selectPlayer')}</p>
                  <button
                    className="px-6 py-3 rounded-xl font-bold text-gray-900 bg-gold hover:bg-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        {currentPlayer && gameState.phase !== 'ended' && (
          <SwipeableDrawer
            players={gameState.players}
            currentPlayer={currentPlayer}
            currentTurnPlayer={currentTurnPlayer}
            selectedPlayers={selectedPlayers}
            onSelectPlayer={
              currentPlayer?.drinksToDistribute
                ? (playerId) => togglePlayerSelection(playerId)
                : undefined
            }
          />
        )}
      </div>

      {/* Replay Vote Modal */}
      <Modal
        isOpen={showReplayModal && !hasVoted}
        title={t('endGame.playAgain')}
        showCloseButton={false}
        size="md"
      >
        <div className="text-center">
          <p className="text-lg text-white/90 mb-6">{t('endGame.waitingForVotes')}</p>
          <div className="flex gap-4 justify-center">
            <button
              className="btn btn-success btn-lg min-w-[120px]"
              onClick={() => handleVoteReplay(true)}
            >
              {t('common.yes')}
            </button>
            <button
              className="btn btn-danger btn-lg min-w-[120px]"
              onClick={() => handleVoteReplay(false)}
            >
              {t('common.no')}
            </button>
          </div>
        </div>
      </Modal>

      {/* New Redesigned Modals */}
      <SuccessModal
        isOpen={activeModal === 'success'}
        prediction={modalData.prediction || ''}
        result={modalData.result || ''}
        card={modalData.card || null}
        otherPlayers={modalData.otherPlayers || []}
        onContinue={handleConfirmDrink}
      />

      <DrinkModal
        isOpen={activeModal === 'drink'}
        prediction={modalData.prediction || ''}
        result={modalData.result || ''}
        card={modalData.card || null}
        drinkCount={pendingDrink?.amount || 1}
        onConfirm={handleConfirmDrink}
      />

      <OtherPlayerResultModal
        isOpen={activeModal === 'otherResult'}
        playerName={modalData.playerName || ''}
        wasCorrect={true}
        prediction={modalData.prediction || ''}
        result={modalData.result || ''}
        card={modalData.card || null}
        onConfirm={handleConfirmDrink}
      />

      <GiftSelectionModal
        isOpen={activeModal === 'gift'}
        drinksToGive={modalData.drinksToGive || 0}
        players={gameState?.players || []}
        currentPlayerId={currentPlayer?.id || ''}
        onConfirm={(selectedIds) => {
          if (selectedIds.length > 0 && currentPlayer) {
            distributeDrinks(selectedIds, currentPlayer.drinksToDistribute);
          }
          handleConfirmDrink();
        }}
      />

      <NoMatchModal
        isOpen={activeModal === 'noMatch'}
        card={modalData.card || null}
        drinkCount={pendingDrink?.amount || 1}
        playerHand={currentPlayer?.hand || []}
        onConfirm={handleConfirmDrink}
      />

      <PyramidMatchModal
        isOpen={activeModal === 'pyramidMatch'}
        card={modalData.card || null}
        rowNumber={modalData.rowNumber || 0}
        drinkCount={pendingDrink?.amount || 1}
        playerHand={currentPlayer?.hand || []}
        onConfirm={handleConfirmDrink}
      />

      <OtherPlayerDrinkModal
        isOpen={activeModal === 'otherPlayerDrink'}
        playerName={modalData.playerName || ''}
        rowNumber={modalData.rowNumber || 0}
        drinkCount={pendingDrink?.amount || 1}
        card={modalData.card || null}
        playerHand={modalData.matchingPlayerHand as any || []}
        onConfirm={handleConfirmDrink}
      />

      <GiftReceivedModal
        isOpen={activeModal === 'giftReceived'}
        senderName={modalData.playerName || ''}
        drinkCount={pendingDrink?.amount || 1}
        card={modalData.card || null}
        onConfirm={handleConfirmDrink}
      />

      <OtherPlayerGiftingModal
        isOpen={activeModal === 'otherPlayerGifting'}
        playerNames={[modalData.playerName || '']}
        drinksToDistribute={modalData.drinksToGive || 0}
        onConfirm={handleConfirmDrink}
      />

      <SomeoneIsDrinkingModal
        isOpen={activeModal === 'someoneIsDrinking'}
        playerName={modalData.playerName || ''}
        drinkCount={pendingDrink?.amount || 1}
        reason={pendingDrink?.reason || ''}
        card={modalData.card || null}
        onConfirm={handleConfirmDrink}
      />
    </main>
  );
}
