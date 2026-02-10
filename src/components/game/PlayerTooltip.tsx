'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayingCard } from '@/components/ui';
import { Card, Player } from '@/lib/game-engine/types';

interface PlayerTooltipProps {
  player: Player;
  isCurrentUser: boolean;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onSelect?: () => void;
}

// Get wasted status based on drink count
function getWastedStatus(drinks: number): { label: string; emoji: string; color: string } {
  if (drinks === 0) return { label: 'Sober', emoji: '😐', color: '#4ecdc4' };
  if (drinks <= 2) return { label: 'Tipsy', emoji: '😊', color: '#a8e6cf' };
  if (drinks <= 4) return { label: 'Buzzed', emoji: '😄', color: '#f0d77c' };
  if (drinks <= 7) return { label: 'Drunk', emoji: '🥴', color: '#ff8c00' };
  if (drinks <= 10) return { label: 'Wasted', emoji: '🤪', color: '#ff6b6b' };
  return { label: 'Destroyed', emoji: '💀', color: '#ff0040' };
}

export function PlayerTooltip({
  player,
  isCurrentUser,
  isCurrentTurn,
  isSelected,
  onSelect,
}: PlayerTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  const wastedStatus = getWastedStatus(player.drinks);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Player Avatar */}
      <div
        ref={avatarRef}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) {
            onSelect();
          } else {
            setShowTooltip(!showTooltip);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowTooltip(!showTooltip);
        }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: isCurrentTurn
            ? 'linear-gradient(135deg, #d4af37, #a68b2a)'
            : isSelected
            ? 'linear-gradient(135deg, #4ecdc4, #2d9a93)'
            : 'rgba(255, 255, 255, 0.1)',
          border: isCurrentTurn
            ? '2px solid #f0d77c'
            : isSelected
            ? '2px solid #4ecdc4'
            : '2px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isCurrentTurn ? '0 0 12px rgba(212, 175, 55, 0.5)' : 'none',
          opacity: player.isConnected ? 1 : 0.5,
        }}
      >
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: isCurrentTurn ? '#1a1a1a' : '#fff',
          lineHeight: 1,
        }}>
          {player.nickname.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name label below avatar */}
      <div style={{
        textAlign: 'center',
        marginTop: 2,
        maxWidth: 52,
      }}>
        <span style={{
          fontSize: '0.55rem',
          color: 'rgba(255, 255, 255, 0.7)',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {player.isDealer ? '👑 ' : ''}{player.nickname}
          {isCurrentUser ? '' : ''}
        </span>
      </div>

      {/* Tooltip Popover */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 8,
            background: 'rgba(10, 15, 10, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            padding: '12px 14px',
            minWidth: 160,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12,
            height: 12,
            background: 'rgba(10, 15, 10, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderBottom: 'none',
            borderRight: 'none',
          }} />

          {/* Player Name */}
          <div style={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#fff',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {player.isDealer && <span>👑</span>}
            {player.nickname}
            {isCurrentUser && (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>(You)</span>
            )}
          </div>

          {/* Wasted Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
            padding: '4px 8px',
            background: `${wastedStatus.color}15`,
            borderRadius: 6,
            border: `1px solid ${wastedStatus.color}30`,
          }}>
            <span style={{ fontSize: '1rem' }}>{wastedStatus.emoji}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: wastedStatus.color }}>
              {wastedStatus.label}
            </span>
          </div>

          {/* Drink Count */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 4,
          }}>
            <span>🍺 Drinks</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>{player.drinks}</span>
          </div>

          {/* Distribute count */}
          {player.drinksToDistribute > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#4ecdc4',
              marginBottom: 4,
            }}>
              <span>🎁 To Give</span>
              <span style={{ fontWeight: 700 }}>{player.drinksToDistribute}</span>
            </div>
          )}

          {/* Player Hand - with 60% overlap */}
          {player.hand.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Hand ({player.hand.length})
              </div>
              <div style={{
                display: 'flex',
                paddingLeft: 4,
              }}>
                {player.hand.map((card, idx) => (
                  <div
                    key={card.id}
                    style={{
                      marginLeft: idx === 0 ? 0 : -20, // 60% overlap for xxs cards (36px * 0.6 ≈ 22)
                      zIndex: idx,
                      position: 'relative',
                    }}
                  >
                    <PlayingCard card={card} size="xxs" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection status if disconnected */}
          {!player.isConnected && (
            <div style={{
              marginTop: 6,
              fontSize: '0.7rem',
              color: '#ff6b6b',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              ⚠️ Disconnected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
