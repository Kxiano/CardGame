'use client';

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import styles from './DrinkModal.module.css';

interface DrinkModalProps {
  isOpen: boolean;
  amount: number;
  reason: string;
  sourcePlayerName?: string;
  onConfirm: () => void;
}

export function DrinkModal({ 
  isOpen, 
  amount, 
  reason, 
  sourcePlayerName,
  onConfirm 
}: DrinkModalProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  // Format the reason to be more user-friendly
  const getTitle = () => {
    if (reason.includes('correctly')) return '😅 Others got it right!';
    if (reason.includes('incorrectly')) return '❌ Wrong answer!';
    if (reason.includes('Truco backfired')) return '🔥 Truco backfired!';
    if (reason.includes('No matches') || reason.includes('everyone drinks')) return '🍺 Nobody matched!';
    if (reason.includes('Matched')) return '😱 You matched!';
    if (sourcePlayerName) return `🎁 ${sourcePlayerName} sends drinks!`;
    return '🍺 Time to drink!';
  };

  return (
    <Modal isOpen={isOpen} title={getTitle()} showCloseButton={false} size="sm">
      <div className={styles.content}>
        <div className={styles.drinkAmount}>
          <span className={styles.number}>{amount}</span>
          <span className={styles.label}>{amount === 1 ? 'drink' : 'drinks'}</span>
        </div>
        
        <p className={styles.reason}>{reason}</p>
        
        <div className={styles.glassAnimation}>
          🍺
        </div>
        
        <button
          className={`btn btn-primary btn-lg ${styles.confirmButton}`}
          onClick={onConfirm}
          disabled={countdown > 0}
        >
          {countdown > 0 ? `Wait ${countdown}s...` : "I've had my drink! 🍻"}
        </button>
      </div>
    </Modal>
  );
}
