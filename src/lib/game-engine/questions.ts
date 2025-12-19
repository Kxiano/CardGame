import { Card, CardValue, Difficulty, Question, QuestionType, Suit } from './types';
import { compareValues, isInside, isOdd } from './deck';

// Question definitions with translations
export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    type: 'odd_even',
    text: {
      en: 'Is the next card Odd or Even?',
      'pt-BR': 'A próxima carta é Ímpar ou Par?',
      hu: 'A következő lap páros vagy páratlan?',
    },
    options: {
      en: ['Odd', 'Even'],
      'pt-BR': ['Ímpar', 'Par'],
      hu: ['Páratlan', 'Páros'],
    },
  },
  {
    id: 'q2',
    type: 'higher_lower',
    text: {
      en: "Is the next card's value Higher or Lower than the card you just received?",
      'pt-BR': 'O valor da próxima carta é Maior ou Menor que a carta que você acabou de receber?',
      hu: 'A következő lap értéke magasabb vagy alacsonyabb, mint az előző lapod?',
    },
    options: {
      en: ['Higher', 'Lower'],
      'pt-BR': ['Maior', 'Menor'],
      hu: ['Magasabb', 'Alacsonyabb'],
    },
  },
  {
    id: 'q3',
    type: 'inside_outside',
    text: {
      en: "Is the next card's value Inside or Outside the range set by your first two cards?",
      'pt-BR': 'O valor da próxima carta está Dentro ou Fora do intervalo definido pelas suas duas primeiras cartas?',
      hu: 'A következő lap értéke az első két lapod értéke között van, vagy kívül esik?',
    },
    options: {
      en: ['Inside', 'Outside'],
      'pt-BR': ['Dentro', 'Fora'],
      hu: ['Belül', 'Kívül'],
    },
  },
  {
    id: 'q4',
    type: 'suit',
    text: {
      en: 'What is the suit of the next card?',
      'pt-BR': 'Qual é o naipe da próxima carta?',
      hu: 'Mi a következő lap színe?',
    },
    options: {
      en: ['Hearts ♥', 'Diamonds ♦', 'Clubs ♣', 'Spades ♠'],
      'pt-BR': ['Copas ♥', 'Ouros ♦', 'Paus ♣', 'Espadas ♠'],
      hu: ['Kőr ♥', 'Káró ♦', 'Treff ♣', 'Pikk ♠'],
    },
  },
  {
    id: 'q5',
    type: 'have_suit',
    text: {
      en: 'Do you already have a card of this suit?',
      'pt-BR': 'Você já tem uma carta deste naipe?',
      hu: 'Van már ilyen színű lapod?',
    },
    options: {
      en: ['Yes', 'No'],
      'pt-BR': ['Sim', 'Não'],
      hu: ['Igen', 'Nem'],
    },
  },
  {
    id: 'q6',
    type: 'number',
    text: {
      en: 'What is the number/face of the next card?',
      'pt-BR': 'Qual é o número/face da próxima carta?',
      hu: 'Mi a következő lap értéke?',
    },
    options: {
      en: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
      'pt-BR': ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'],
      hu: ['Á', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'],
    },
  },
  {
    id: 'q7',
    type: 'have_number',
    text: {
      en: 'Do you already have a card of this number?',
      'pt-BR': 'Você já tem uma carta deste número?',
      hu: 'Van már ilyen értékű lapod?',
    },
    options: {
      en: ['Yes', 'No'],
      'pt-BR': ['Sim', 'Não'],
      hu: ['Igen', 'Nem'],
    },
  },
];

/**
 * Normalize a localized answer to its English equivalent for storage
 */
export function normalizeAnswerToEnglish(answer: string): string {
  // Create a reverse map from any locale to English
  const toEnglishMap: Record<string, string> = {
    // Odd/Even
    'Odd': 'Odd', 'Even': 'Even',
    'Ímpar': 'Odd', 'Par': 'Even',
    'Páratlan': 'Odd', 'Páros': 'Even',
    // Higher/Lower
    'Higher': 'Higher', 'Lower': 'Lower',
    'Maior': 'Higher', 'Menor': 'Lower',
    'Magasabb': 'Higher', 'Alacsonyabb': 'Lower',
    // Inside/Outside
    'Inside': 'Inside', 'Outside': 'Outside',
    'Dentro': 'Inside', 'Fora': 'Outside',
    'Belül': 'Inside', 'Kívül': 'Outside',
    // Suits
    'Hearts ♥': 'Hearts ♥', 'Diamonds ♦': 'Diamonds ♦', 'Clubs ♣': 'Clubs ♣', 'Spades ♠': 'Spades ♠',
    'Copas ♥': 'Hearts ♥', 'Ouros ♦': 'Diamonds ♦', 'Paus ♣': 'Clubs ♣', 'Espadas ♠': 'Spades ♠',
    'Kőr ♥': 'Hearts ♥', 'Káró ♦': 'Diamonds ♦', 'Treff ♣': 'Clubs ♣', 'Pikk ♠': 'Spades ♠',
    // Yes/No
    'Yes': 'Yes', 'No': 'No',
    'Sim': 'Yes', 'Não': 'No',
    'Igen': 'Yes', 'Nem': 'No',
    // Card values - map localized face cards to English
    'V': 'J', 'D': 'Q', 'R': 'K',  // pt-BR
    'Á': 'A', 'B': 'J',            // hu
  };
  
  return toEnglishMap[answer] || answer;
}

/**
 * Get questions based on difficulty level
 */
export function getQuestionsForDifficulty(difficulty: Difficulty): Question[] {
  switch (difficulty) {
    case 'easy':
      return QUESTIONS.slice(0, 3);
    case 'normal':
      return QUESTIONS.slice(0, 5);
    case 'hard':
      return QUESTIONS;
  }
}

/**
 * Validate an answer for a question
 */
export function validateAnswer(
  questionType: QuestionType,
  answer: string,
  drawnCard: Card,
  playerHand: Card[],
  locale: 'en' | 'pt-BR' | 'hu' = 'en'
): boolean {
  // Map localized answers to standard values
  const answerMap: Record<string, Record<string, string>> = {
    en: {
      'Odd': 'odd',
      'Even': 'even',
      'Higher': 'higher',
      'Lower': 'lower',
      'Inside': 'inside',
      'Outside': 'outside',
      'Hearts ♥': 'hearts',
      'Diamonds ♦': 'diamonds',
      'Clubs ♣': 'clubs',
      'Spades ♠': 'spades',
      'Yes': 'yes',
      'No': 'no',
    },
    'pt-BR': {
      'Ímpar': 'odd',
      'Par': 'even',
      'Maior': 'higher',
      'Menor': 'lower',
      'Dentro': 'inside',
      'Fora': 'outside',
      'Copas ♥': 'hearts',
      'Ouros ♦': 'diamonds',
      'Paus ♣': 'clubs',
      'Espadas ♠': 'spades',
      'Sim': 'yes',
      'Não': 'no',
    },
    hu: {
      'Páratlan': 'odd',
      'Páros': 'even',
      'Magasabb': 'higher',
      'Alacsonyabb': 'lower',
      'Belül': 'inside',
      'Kívül': 'outside',
      'Kőr ♥': 'hearts',
      'Káró ♦': 'diamonds',
      'Treff ♣': 'clubs',
      'Pikk ♠': 'spades',
      'Igen': 'yes',
      'Nem': 'no',
    },
  };

  // Check all locales for the answer (in case locale doesn't match the answer)
  let normalizedAnswer = answer.toLowerCase();
  for (const loc of Object.keys(answerMap)) {
    if (answerMap[loc][answer]) {
      normalizedAnswer = answerMap[loc][answer];
      break;
    }
  }

  switch (questionType) {
    case 'odd_even': {
      const cardIsOdd = isOdd(drawnCard.value);
      return (normalizedAnswer === 'odd') === cardIsOdd;
    }

    case 'higher_lower': {
      if (playerHand.length === 0) return false;
      const lastCard = playerHand[playerHand.length - 1];
      const comparison = compareValues(drawnCard.value, lastCard.value);
      if (comparison === 'equal') {
        // Equal counts as wrong for both higher and lower
        return false;
      }
      return normalizedAnswer === comparison;
    }

    case 'inside_outside': {
      if (playerHand.length < 2) return false;
      const card1 = playerHand[0];
      const card2 = playerHand[1];
      const cardIsInside = isInside(drawnCard.value, card1.value, card2.value);
      return (normalizedAnswer === 'inside') === cardIsInside;
    }

    case 'suit': {
      return normalizedAnswer === drawnCard.suit;
    }

    case 'have_suit': {
      const hasSuit = playerHand.some(card => card.suit === drawnCard.suit);
      return (normalizedAnswer === 'yes') === hasSuit;
    }

    case 'number': {
      const valueMap: Record<string, CardValue> = {
        'a': 1, 'á': 1,
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '8': 8, '9': 9, '10': 10,
        'j': 11, 'v': 11, 'b': 11,
        'q': 12, 'd': 12,
        'k': 13, 'r': 13,
      };
      const guessedValue = valueMap[normalizedAnswer.toLowerCase()];
      return guessedValue === drawnCard.value;
    }

    case 'have_number': {
      const hasNumber = playerHand.some(card => card.value === drawnCard.value);
      return (normalizedAnswer === 'yes') === hasNumber;
    }

    default:
      return false;
  }
}

/**
 * Get the current question for a player based on the question index
 */
export function getCurrentQuestion(
  difficulty: Difficulty,
  questionIndex: number
): Question | null {
  const questions = getQuestionsForDifficulty(difficulty);
  if (questionIndex >= questions.length) return null;
  return questions[questionIndex];
}

/**
 * Get the total number of questions for a difficulty
 */
export function getQuestionCount(difficulty: Difficulty): number {
  return getQuestionsForDifficulty(difficulty).length;
}
