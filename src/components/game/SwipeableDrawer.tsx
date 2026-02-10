'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayingCard } from '@/components/ui';
import { Card, Player } from '@/lib/game-engine/types';
import { CardFan } from './CardFan';

interface SwipeableDrawerProps {
  players: Player[];
  currentPlayer: Player | null;
  currentTurnPlayer: Player | null;
  selectedPlayers: string[];
  onSelectPlayer?: (playerId: string) => void;
}

// Get wasted status based on drink count
function getWastedStatus(drinks: number): { label: string; color: string } {
  if (drinks === 0) return { label: 'Sober', color: '#4ecdc4' };
  if (drinks <= 2) return { label: 'Tipsy', color: '#a8e6cf' };
  if (drinks <= 4) return { label: 'Buzzed', color: '#f0d77c' };
  if (drinks <= 7) return { label: 'Drunk', color: '#ff8c00' };
  if (drinks <= 10) return { label: 'Wasted', color: '#ff6b6b' };
  return { label: 'Destroyed', color: '#ff0040' };
}

export function SwipeableDrawer({
  players,
  currentPlayer,
  currentTurnPlayer,
  selectedPlayers,
  onSelectPlayer,
}: SwipeableDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isDragging = useRef(false);

  // Close drawer on outside click
  useEffect(() => {
    if (!isExpanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchStartY.current - touchCurrentY.current;
    // Swipe up to expand (threshold 50px)
    if (deltaY > 50 && !isExpanded) {
      setIsExpanded(true);
    }
    // Swipe down to collapse
    if (deltaY < -50 && isExpanded) {
      setIsExpanded(false);
    }
  }, [isExpanded]);

  const playerCards = currentPlayer?.hand || [];

  return (
    <div
      ref={drawerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        background: isExpanded
          ? 'linear-gradient(180deg, rgba(20, 20, 20, 0.98) 0%, rgba(10, 10, 10, 0.99) 100%)'
          : 'rgba(0, 0, 0, 0.4)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: isExpanded ? '16px 16px 0 0' : '0',
        maxHeight: isExpanded ? '80vh' : 'auto',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
      }}
    >
      {/* Pull indicator */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '6px 0 0',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.3)',
          marginBottom: 4,
        }} />
      </div>

      {/* Collapsed: YOUR HAND + Card Fan */}
      {!isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* YOUR HAND label row */}
          <div
            onClick={() => setIsExpanded(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0 16px 2px',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Your Hand
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: '0.65rem',
                color: '#d4af37',
                fontWeight: 700,
              }}>
                {playerCards.length} Cards
              </span>
              <span style={{
                fontSize: '0.6rem',
                color: 'rgba(255, 255, 255, 0.3)',
                transform: 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}>
                ▲
              </span>
            </div>
          </div>

          {/* Card Fan */}
          <CardFan cards={playerCards} />
        </div>
      )}

      {/* Expanded: Table Overview */}
      {isExpanded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px 12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#fff',
              }}>
                Table Overview
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.4)',
              }}>
                {players.length} Players
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Player List - Scrollable */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            {players.map((player) => {
              const isCurrentTurn = currentTurnPlayer?.id === player.id;
              const isMe = currentPlayer?.id === player.id;
              const isSelected = selectedPlayers.includes(player.id);
              const wastedStatus = getWastedStatus(player.drinks);

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    if (onSelectPlayer && !isMe) {
                      onSelectPlayer(player.id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: isCurrentTurn
                      ? 'rgba(212, 175, 55, 0.12)'
                      : isSelected
                      ? 'rgba(78, 205, 196, 0.1)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isCurrentTurn
                      ? '1px solid rgba(212, 175, 55, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    cursor: onSelectPlayer && !isMe ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    opacity: player.isConnected ? 1 : 0.5,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isCurrentTurn
                      ? 'linear-gradient(135deg, #d4af37, #a68b2a)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: isCurrentTurn
                      ? '2px solid #f0d77c'
                      : '2px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: isCurrentTurn ? '#1a1a1a' : '#fff',
                    }}>
                      {player.nickname.charAt(0).toUpperCase()}
                    </span>
                    {/* Dealer crown */}
                    {player.isDealer && (
                      <span style={{
                        position: 'absolute',
                        top: -8,
                        right: -4,
                        fontSize: '0.7rem',
                      }}>👑</span>
                    )}
                  </div>

                  {/* Name + Status */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {player.nickname}
                      </span>
                      {isCurrentTurn && (
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          color: '#1a1a1a',
                          background: '#d4af37',
                          padding: '1px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Turn
                        </span>
                      )}
                      {isMe && (
                        <span style={{
                          fontSize: '0.6rem',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}>(You)</span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: wastedStatus.color,
                      fontWeight: 600,
                    }}>
                      {wastedStatus.label}
                    </span>
                  </div>

                  {/* Card Stack (mini) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}>
                    {player.hand.length > 0 ? (
                      <div style={{ display: 'flex', position: 'relative' }}>
                        {player.hand.slice(0, 3).map((card, idx) => (
                          <div
                            key={card.id}
                            style={{
                              marginLeft: idx === 0 ? 0 : -18,
                              zIndex: idx,
                              position: 'relative',
                            }}
                          >
                            <PlayingCard card={card} size="xxs" />
                          </div>
                        ))}
                        {player.hand.length > 3 && (
                          <span style={{
                            position: 'absolute',
                            right: -6,
                            bottom: -2,
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            color: '#fff',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '0 3px',
                            borderRadius: 3,
                            zIndex: 10,
                          }}>
                            +{player.hand.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontStyle: 'italic',
                      }}>
                        No cards
                      </span>
                    )}
                  </div>

                  {/* Separator line */}
                  <div style={{
                    width: 1,
                    height: 28,
                    background: 'rgba(255, 255, 255, 0.1)',
                    flexShrink: 0,
                  }} />

                  {/* Drink Count */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                    minWidth: 36,
                  }}>
                    <span style={{ fontSize: '1rem' }}>🍺</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: '#fff',
                    }}>
                      {player.drinks}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Return to Table Button */}
          <div style={{
            padding: '12px 16px 16px',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #d4af37 0%, #a68b2a 100%)',
                color: '#1a1a1a',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Return to Table
              <span style={{ fontSize: '0.8rem' }}>▾</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
