import { Card, CardValue, Suit } from './types';
import { v4 as uuidv4 } from 'uuid';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        id: uuidv4(),
        suit,
        value,
        faceUp: false,
      });
    }
  }
  
  return deck;
}

/**
 * Fisher-Yates shuffle algorithm for randomizing the deck
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Draw a card from the top of the deck
 */
export function drawCard(deck: Card[]): { card: Card | null; remainingDeck: Card[] } {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] };
  }
  
  const [card, ...remainingDeck] = deck;
  return { card: { ...card, faceUp: true }, remainingDeck };
}

/**
 * Get display name for a card value
 */
export function getCardValueName(value: CardValue, locale: 'en' | 'pt-BR' | 'hu' = 'en'): string {
  const names: Record<string, Record<number, string>> = {
    en: {
      1: 'Ace',
      11: 'Jack',
      12: 'Queen',
      13: 'King',
    },
    'pt-BR': {
      1: 'Ás',
      11: 'Valete',
      12: 'Dama',
      13: 'Rei',
    },
    hu: {
      1: 'Ász',
      11: 'Bubi',
      12: 'Dáma',
      13: 'Király',
    },
  };
  
  return names[locale][value] || value.toString();
}

/**
 * Get display name for a suit
 */
export function getSuitName(suit: Suit, locale: 'en' | 'pt-BR' | 'hu' = 'en'): string {
  const names: Record<string, Record<Suit, string>> = {
    en: {
      hearts: 'Hearts',
      diamonds: 'Diamonds',
      clubs: 'Clubs',
      spades: 'Spades',
    },
    'pt-BR': {
      hearts: 'Copas',
      diamonds: 'Ouros',
      clubs: 'Paus',
      spades: 'Espadas',
    },
    hu: {
      hearts: 'Kőr',
      diamonds: 'Káró',
      clubs: 'Treff',
      spades: 'Pikk',
    },
  };
  
  return names[locale][suit];
}

/**
 * Get the suit symbol
 */
export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  
  return symbols[suit];
}

/**
 * Get the suit color
 */
export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

/**
 * Check if a card value is odd
 */
export function isOdd(value: CardValue): boolean {
  return value % 2 === 1;
}

/**
 * Compare two card values
 */
export function compareValues(value1: CardValue, value2: CardValue): 'higher' | 'lower' | 'equal' {
  if (value1 > value2) return 'higher';
  if (value1 < value2) return 'lower';
  return 'equal';
}

/**
 * Check if a value is inside a range (inclusive - boundaries count as inside)
 */
export function isInside(value: CardValue, card1Value: CardValue, card2Value: CardValue): boolean {
  const min = Math.min(card1Value, card2Value);
  const max = Math.max(card1Value, card2Value);
  return value >= min && value <= max;
}
