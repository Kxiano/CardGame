import { Card, PyramidRow } from './types';

/**
 * Generate the pyramid structure based on the number of players
 * 
 * Row 1 (base): 5 cards - players take 1 drink
 * Row 2: 4 cards - players distribute 2 drinks
 * Row 3: 3 cards - players take 3 drinks
 * Row 4: 2 cards - players distribute 4 drinks
 * Row 5 (top): 1 + playerCount cards - players take 5 drinks
 */
export function generatePyramid(deck: Card[], playerCount: number): { pyramid: PyramidRow[]; remainingDeck: Card[] } {
  const pyramid: PyramidRow[] = [];
  let currentDeck = [...deck];
  
  // Row 1: 5 cards, take 1 drink
  const row1Cards = currentDeck.slice(0, 5);
  currentDeck = currentDeck.slice(5);
  pyramid.push({
    rowNumber: 1,
    cards: row1Cards.map(c => ({ ...c, faceUp: false })),
    drinkMultiplier: 1,
    isDistribute: false,
  });
  
  // Row 2: 4 cards, distribute 2 drinks
  const row2Cards = currentDeck.slice(0, 4);
  currentDeck = currentDeck.slice(4);
  pyramid.push({
    rowNumber: 2,
    cards: row2Cards.map(c => ({ ...c, faceUp: false })),
    drinkMultiplier: 2,
    isDistribute: true,
  });
  
  // Row 3: 3 cards, take 3 drinks
  const row3Cards = currentDeck.slice(0, 3);
  currentDeck = currentDeck.slice(3);
  pyramid.push({
    rowNumber: 3,
    cards: row3Cards.map(c => ({ ...c, faceUp: false })),
    drinkMultiplier: 3,
    isDistribute: false,
  });
  
  // Row 4: 2 cards, distribute 4 drinks
  const row4Cards = currentDeck.slice(0, 2);
  currentDeck = currentDeck.slice(2);
  pyramid.push({
    rowNumber: 4,
    cards: row4Cards.map(c => ({ ...c, faceUp: false })),
    drinkMultiplier: 4,
    isDistribute: true,
  });
  
  // Row 5: 1 + playerCount cards, take 5 drinks
  const row5CardCount = 1 + playerCount;
  const row5Cards = currentDeck.slice(0, row5CardCount);
  currentDeck = currentDeck.slice(row5CardCount);
  pyramid.push({
    rowNumber: 5,
    cards: row5Cards.map(c => ({ ...c, faceUp: false })),
    drinkMultiplier: 5,
    isDistribute: false,
  });
  
  return { pyramid, remainingDeck: currentDeck };
}

/**
 * Get the total number of cards in the pyramid
 */
export function getTotalPyramidCards(playerCount: number): number {
  return 5 + 4 + 3 + 2 + (1 + playerCount);
}

/**
 * Reveal a card in the pyramid
 */
export function revealPyramidCard(
  pyramid: PyramidRow[],
  rowIndex: number,
  cardIndex: number
): PyramidRow[] {
  return pyramid.map((row, rIdx) => {
    if (rIdx !== rowIndex) return row;
    
    return {
      ...row,
      cards: row.cards.map((card, cIdx) => {
        if (cIdx !== cardIndex) return card;
        return { ...card, faceUp: true };
      }),
    };
  });
}

/**
 * Find matching cards in players' hands
 */
export function findMatchingCards(
  pyramidCard: Card,
  playerHands: { playerId: string; hand: Card[] }[]
): { playerId: string; matchingCards: Card[] }[] {
  const matches: { playerId: string; matchingCards: Card[] }[] = [];
  
  for (const { playerId, hand } of playerHands) {
    const matchingCards = hand.filter(card => card.value === pyramidCard.value);
    if (matchingCards.length > 0) {
      matches.push({ playerId, matchingCards });
    }
  }
  
  return matches;
}

/**
 * Calculate drinks for a pyramid reveal
 */
export function calculatePyramidDrinks(
  pyramidRow: PyramidRow,
  pyramidCard: Card,
  playerHands: { playerId: string; hand: Card[] }[],
  allPlayerIds: string[]
): {
  matchesFound: boolean;
  drinkAssignments: { playerId: string; amount: number; type: 'take' | 'distribute' }[];
} {
  const matches = findMatchingCards(pyramidCard, playerHands);
  const matchesFound = matches.length > 0;
  
  const drinkAssignments: { playerId: string; amount: number; type: 'take' | 'distribute' }[] = [];
  
  if (!matchesFound) {
    // No matches: everyone takes 1 drink
    for (const playerId of allPlayerIds) {
      drinkAssignments.push({
        playerId,
        amount: 1,
        type: 'take',
      });
    }
  } else {
    // Matches found: calculate based on row type
    for (const { playerId, matchingCards } of matches) {
      const totalDrinks = matchingCards.length * pyramidRow.drinkMultiplier;
      
      drinkAssignments.push({
        playerId,
        amount: totalDrinks,
        type: pyramidRow.isDistribute ? 'distribute' : 'take',
      });
    }
  }
  
  return { matchesFound, drinkAssignments };
}
