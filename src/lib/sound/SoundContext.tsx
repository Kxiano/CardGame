'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Howl } from 'howler';

interface SoundContextType {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (sound: SoundEffect) => void;
}

export type SoundEffect = 
  | 'cardFlip'
  | 'cardDeal'
  | 'correct'
  | 'wrong'
  | 'truco'
  | 'bell'
  | 'success'
  | 'click'
  | 'drink'
  | 'ready';

const SoundContext = createContext<SoundContextType | null>(null);

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

// Sound configurations - using Web Audio API compatible sounds
const soundConfigs: Record<SoundEffect, { src: string; volume?: number }> = {
  cardFlip: { src: '/sounds/card-flip.mp3', volume: 0.5 },
  cardDeal: { src: '/sounds/card-deal.mp3', volume: 0.4 },
  correct: { src: '/sounds/correct.mp3', volume: 0.6 },
  wrong: { src: '/sounds/wrong.mp3', volume: 0.6 },
  truco: { src: '/sounds/truco.mp3', volume: 0.8 },
  bell: { src: '/sounds/bell.mp3', volume: 0.5 },
  success: { src: '/sounds/success.mp3', volume: 0.6 },
  click: { src: '/sounds/click.mp3', volume: 0.3 },
  drink: { src: '/sounds/faah.mp3', volume: 0.7 },
  ready: { src: '/sounds/tome.mp3', volume: 0.6 },
};

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [sounds, setSounds] = useState<Record<string, Howl>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load saved preferences
    const savedMuted = localStorage.getItem('xerekinha-muted');
    const savedVolume = localStorage.getItem('xerekinha-volume');
    
    if (savedMuted !== null) {
      setIsMuted(savedMuted === 'true');
    }
    if (savedVolume !== null) {
      setVolumeState(parseFloat(savedVolume));
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Initialize sounds
    const loadedSounds: Record<string, Howl> = {};
    
    Object.entries(soundConfigs).forEach(([key, config]) => {
      loadedSounds[key] = new Howl({
        src: [config.src],
        volume: (config.volume || 1) * volume,
        preload: true,
      });
    });
    
    setSounds(loadedSounds);

    return () => {
      // Cleanup sounds
      Object.values(loadedSounds).forEach(sound => sound.unload());
    };
  }, [isClient]);

  // Update volumes when global volume changes
  useEffect(() => {
    if (!isClient) return;
    
    Object.entries(sounds).forEach(([key, sound]) => {
      const config = soundConfigs[key as SoundEffect];
      sound.volume((config?.volume || 1) * volume);
    });
  }, [volume, sounds, isClient]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newValue = !prev;
      localStorage.setItem('xerekinha-muted', String(newValue));
      return newValue;
    });
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    localStorage.setItem('xerekinha-volume', String(clampedVolume));
  }, []);

  const playSound = useCallback((sound: SoundEffect) => {
    if (isMuted || !isClient) return;
    
    const howl = sounds[sound];
    if (howl) {
      howl.play();
    }
  }, [isMuted, sounds, isClient]);

  return (
    <SoundContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}
