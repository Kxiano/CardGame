// Card Types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  value: CardValue;
  faceUp: boolean;
}

// Game Types
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GamePhase = 'lobby' | 'setup' | 'questions' | 'revelation' | 'ended';

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  isDealer: boolean;
  isReady: boolean;
  isConnected: boolean;
  hand: Card[];
  drinks: number;
  drinksToDistribute: number;
}

export interface PyramidRow {
  rowNumber: number;
  cards: Card[];
  drinkMultiplier: number;
  isDistribute: boolean; // true for rows 2,4 (distribute), false for 1,3,5 (take)
}

export interface Question {
  id: string;
  type: QuestionType;
  text: {
    en: string;
    'pt-BR': string;
    hu: string;
  };
  options: {
    en: string[];
    'pt-BR': string[];
    hu: string[];
  };
}

export type QuestionType = 
  | 'odd_even'
  | 'higher_lower'
  | 'inside_outside'
  | 'suit'
  | 'have_suit'
  | 'number'
  | 'have_number';

export interface TrucoVote {
  playerId: string;
  playerName: string;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  difficulty: Difficulty;
  trucoEnabled: boolean;
  players: Player[];
  deck: Card[];
  pyramid: PyramidRow[];
  currentPlayerIndex: number;
  currentQuestionIndex: number;
  currentPyramidRow: number;
  currentPyramidCard: number;
  trucoVotes: TrucoVote[];
  trucoSkips: string[]; // playerIds who opted not to call Truco
  awaitingTruco: boolean;
  lastAnswer: {
    playerId: string;
    playerName: string;
    answer: string;
    correct: boolean;
    card: Card;
  } | null;
  revealedCard: Card | null;
  matchingCardIds: string[]; // IDs of cards that match the revealed pyramid card
  drinkEvents: DrinkEvent[];
  pendingDrinkConfirmations: PendingDrink[]; // Drinks waiting for player confirmation
  replayVotes: { [playerId: string]: boolean };
  dealerAskedReplay: boolean;
}

export interface PendingDrink {
  id: string;
  playerId: string;
  amount: number;
  reason: string;
  sourcePlayerName?: string;
}

export interface DrinkEvent {
  id: string;
  type: 'take' | 'distribute' | 'excited'; // excited = "getting excited" overlay for others
  targetPlayerIds: string[];
  sourcePlayerId?: string;
  sourcePlayerName?: string; // Name of player who triggered the event
  amount: number;
  reason: string;
  timestamp: number;
  card?: Card; // The card that triggered this drink
  answer?: string; // The answer that triggered this drink (for question phase)
}

export interface Room {
  id: string;
  gameState: GameState;
  createdAt: number;
}

// Socket Events
export interface ServerToClientEvents {
  'room:created': (roomId: string) => void;
  'room:joined': (gameState: GameState) => void;
  'room:playerJoined': (player: Player) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:playerDisconnected': (playerId: string) => void;
  'room:playerReconnected': (playerId: string) => void;
  'room:error': (message: string) => void;
  'game:stateUpdate': (gameState: GameState) => void;
  'game:drinkEvent': (event: DrinkEvent) => void;
  'game:trucoCall': (vote: TrucoVote) => void;
  'game:pendingDrink': (drink: PendingDrink) => void;
  'game:questionResult': (result: GameState['lastAnswer']) => void;
  'game:replayVoteRequest': () => void;
  'game:replayResult': (startNewGame: boolean, votedYes: string[]) => void;
  'lobbies:update': (lobbies: LobbyInfo[]) => void;
}

export interface LobbyInfo {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  difficulty: Difficulty;
}

export interface ClientToServerEvents {
  'room:create': (nickname: string, callback: (roomId: string | null, error?: string, sessionToken?: string) => void) => void;
  'room:join': (roomId: string, nickname: string, callback: (success: boolean, error?: string, sessionToken?: string) => void) => void;
  'room:reconnect': (sessionToken: string, callback: (success: boolean, error?: string, gameState?: GameState) => void) => void;
  'room:leave': () => void;
  'game:setReady': (ready: boolean) => void;
  'game:setDifficulty': (difficulty: Difficulty) => void;
  'game:setTruco': (enabled: boolean) => void;
  'game:start': () => void;
  'game:answer': (answer: string) => void;
  'game:truco': () => void;
  'game:skipTruco': () => void;
  'game:confirmTruco': () => void;
  'game:confirmDrink': (drinkId: string) => void;
  'game:revealPyramidCard': () => void;
  'game:distributeDrinks': (targetPlayerIds: string[], amount: number) => void;
  'game:requestReplay': () => void;
  'game:voteReplay': (vote: boolean) => void;
  'game:reorderPlayers': (sourceIndex: number, destinationIndex: number) => void;
  'lobbies:list': (callback: (lobbies: LobbyInfo[]) => void) => void;
}
