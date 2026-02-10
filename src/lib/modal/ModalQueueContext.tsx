'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Modal types for the queue
export type ModalType = 
  | 'success'        // You're Right
  | 'drink'          // You Drink (wrong answer)
  | 'otherResult'    // Other player result
  | 'giftSelection'  // Select players for gift row
  | 'drinkRow'       // Players drinking confirmation
  | 'assigning';     // Waiting for drink assignment

export interface QueuedModal {
  id: string;
  type: ModalType;
  data: Record<string, unknown>;
  priority?: number; // Higher = more urgent
}

interface ModalQueueContextType {
  currentModal: QueuedModal | null;
  queue: QueuedModal[];
  enqueueModal: (type: ModalType, data: Record<string, unknown>, priority?: number) => string;
  dismissModal: (id?: string) => void;
  clearQueue: () => void;
  isModalOpen: boolean;
}

const ModalQueueContext = createContext<ModalQueueContextType | null>(null);

let modalIdCounter = 0;

function generateModalId(): string {
  modalIdCounter += 1;
  return `modal-${modalIdCounter}-${Date.now()}`;
}

export function ModalQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedModal[]>([]);
  const [currentModal, setCurrentModal] = useState<QueuedModal | null>(null);

  // Enqueue a new modal
  const enqueueModal = useCallback((
    type: ModalType,
    data: Record<string, unknown>,
    priority: number = 0
  ): string => {
    const id = generateModalId();
    const newModal: QueuedModal = { id, type, data, priority };

    setQueue(prev => {
      // Insert by priority (higher priority = earlier in queue)
      const newQueue = [...prev, newModal].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return newQueue;
    });

    // If no modal is currently showing, show this one
    setCurrentModal(current => {
      if (!current) {
        setQueue(prev => prev.filter(m => m.id !== id));
        return newModal;
      }
      return current;
    });

    return id;
  }, []);

  // Dismiss current modal and show next in queue
  const dismissModal = useCallback((id?: string) => {
    setCurrentModal(current => {
      // If id provided, only dismiss if it matches
      if (id && current?.id !== id) return current;
      
      // Get next modal from queue
      setQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          // Use setTimeout to avoid state update during render
          setTimeout(() => setCurrentModal(next), 0);
          return rest;
        }
        return prev;
      });
      
      return null;
    });
  }, []);

  // Clear all modals
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentModal(null);
  }, []);

  const value: ModalQueueContextType = {
    currentModal,
    queue,
    enqueueModal,
    dismissModal,
    clearQueue,
    isModalOpen: currentModal !== null,
  };

  return (
    <ModalQueueContext.Provider value={value}>
      {children}
    </ModalQueueContext.Provider>
  );
}

export function useModalQueue() {
  const context = useContext(ModalQueueContext);
  if (!context) {
    throw new Error('useModalQueue must be used within a ModalQueueProvider');
  }
  return context;
}
