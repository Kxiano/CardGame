import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import { 
  GameState, 
  Player, 
  Room, 
  Difficulty,
  DrinkEvent,
  TrucoVote,
  ClientToServerEvents,
  ServerToClientEvents,
  LobbyInfo
} from '../lib/game-engine/types';
import { createDeck, shuffleDeck, drawCard } from '../lib/game-engine/deck';
import { generatePyramid, revealPyramidCard, calculatePyramidDrinks } from '../lib/game-engine/pyramid';
import { getQuestionsForDifficulty, validateAnswer, getCurrentQuestion, getQuestionCount, normalizeAnswerToEnglish } from '../lib/game-engine/questions';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 3001;

// In-memory storage for rooms
const rooms: Map<string, Room> = new Map();
const playerRooms: Map<string, string> = new Map(); // socketId -> roomId

// Session persistence for reconnection
interface PlayerSession {
  playerId: string;
  roomId: string;
  expiresAt: number; // 0 means no expiry (connected)
}
const playerSessions: Map<string, PlayerSession> = new Map(); // sessionToken -> session
const SESSION_GRACE_PERIOD = 120000; // 2 minutes

function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    phase: 'lobby',
    difficulty: 'normal',
    trucoEnabled: false,
    players: [],
    deck: [],
    pyramid: [],
    currentPlayerIndex: 0,
    currentQuestionIndex: 0,
    currentPyramidRow: 0,
    currentPyramidCard: 0,
    trucoVotes: [],
    trucoSkips: [],
    awaitingTruco: false,
    lastAnswer: null,
    revealedCard: null,
    matchingCardIds: [],
    drinkEvents: [],
    pendingDrinkConfirmations: [],
    replayVotes: {},
    dealerAskedReplay: false,
  };
}

function createPlayer(socketId: string, nickname: string, isDealer: boolean): Player {
  return {
    id: uuidv4(),
    socketId,
    nickname,
    isDealer,
    isReady: isDealer, // Dealer is auto-ready
    isConnected: true,
    hand: [],
    drinks: 0,
    drinksToDistribute: 0,
  };
}

function broadcastGameState(io: SocketIOServer, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('game:stateUpdate', room.gameState);
}

function emitDrinkEvent(io: SocketIOServer, roomId: string, event: DrinkEvent) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.gameState.drinkEvents.push(event);
  
  // Update player drink counts
  for (const playerId of event.targetPlayerIds) {
    const player = room.gameState.players.find(p => p.id === playerId);
    if (player) {
      player.drinks += event.amount;
    }
  }
  
  io.to(roomId).emit('game:drinkEvent', event);
}

function setupGame(room: Room) {
  const { gameState } = room;
  const playerCount = gameState.players.length;
  
  // Create and shuffle deck
  const deck = shuffleDeck(createDeck());
  
  // Generate pyramid
  const { pyramid, remainingDeck } = generatePyramid(deck, playerCount);
  
  gameState.deck = remainingDeck;
  gameState.pyramid = pyramid;
  gameState.phase = 'questions';
  gameState.currentPlayerIndex = 0;
  gameState.currentQuestionIndex = 0;
  
  // Reset player hands and drinks for new game
  for (const player of gameState.players) {
    player.hand = [];
    player.drinks = 0;
    player.drinksToDistribute = 0;
  }
}

function handleAnswer(
  io: SocketIOServer,
  room: Room,
  playerId: string,
  answer: string
) {
  const { gameState } = room;
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return;
  
  // Draw a card
  const { card, remainingDeck } = drawCard(gameState.deck);
  if (!card) return;
  
  gameState.deck = remainingDeck;
  
  // Get current question
  const question = getCurrentQuestion(gameState.difficulty, gameState.currentQuestionIndex);
  if (!question) return;
  
  // Validate answer
  const correct = validateAnswer(question.type, answer, card, player.hand);
  
  // Add card to player's hand (face-down for now if Truco enabled)
  const cardForHand = gameState.trucoEnabled ? { ...card, faceUp: false } : card;
  player.hand.push(cardForHand);
  
  // Store last answer - hide card and result if Truco is enabled
  // Normalize answer to English for cross-language display
  const normalizedAnswer = normalizeAnswerToEnglish(answer);
  gameState.lastAnswer = {
    playerId: player.id,
    playerName: player.nickname,
    answer: normalizedAnswer,
    correct,
    card: gameState.trucoEnabled ? { ...card, faceUp: false } : card, // Hide card during Truco
  };
  
  if (gameState.trucoEnabled) {
    // Enter truco waiting phase - don't reveal result yet!
    gameState.awaitingTruco = true;
    gameState.trucoVotes = [];
    gameState.trucoSkips = [];
  } else {
    // Process answer immediately
    processAnswerResult(io, room, correct);
  }
}

function processAnswerResult(io: SocketIOServer, room: Room, correct: boolean) {
  const { gameState } = room;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Now reveal the card and result!
  if (gameState.lastAnswer) {
    gameState.lastAnswer.card = { ...gameState.lastAnswer.card, faceUp: true };
    // Also update the card in the player's hand to be face-up
    const lastCard = currentPlayer.hand[currentPlayer.hand.length - 1];
    if (lastCard) {
      lastCard.faceUp = true;
    }
  }
  
  // Calculate drinks
  if (correct) {
    // All other players take drinks
    // - Normal players: 1 drink for correct answer
    // - Truco callers: 2 drinks (1 for correct + 1 for backfired truco)
    const trucoCallerIds = gameState.trucoVotes.map(v => v.playerId);
    
    // Non-truco callers (excluding current player) get 1 drink
    const nonTrucoCallerIds = gameState.players
      .filter(p => p.id !== currentPlayer.id && !trucoCallerIds.includes(p.id))
      .map(p => p.id);
    
    if (nonTrucoCallerIds.length > 0) {
      emitDrinkEvent(io, gameState.roomId, {
        id: uuidv4(),
        type: 'take',
        targetPlayerIds: nonTrucoCallerIds,
        sourcePlayerId: currentPlayer.id,
        sourcePlayerName: currentPlayer.nickname,
        amount: 1,
        reason: `${currentPlayer.nickname} answered correctly!`,
        timestamp: Date.now(),
        card: gameState.lastAnswer?.card,
        answer: gameState.lastAnswer?.answer,
      });
    }
    
    // Truco callers get 2 drinks (1 for correct + 1 for backfired truco)
    if (trucoCallerIds.length > 0) {
      emitDrinkEvent(io, gameState.roomId, {
        id: uuidv4(),
        type: 'take',
        targetPlayerIds: trucoCallerIds,
        sourcePlayerId: currentPlayer.id,
        sourcePlayerName: currentPlayer.nickname,
        amount: 2,
        reason: `Truco backfired! ${currentPlayer.nickname} got it right. (+1 penalty)`,
        timestamp: Date.now(),
        card: gameState.lastAnswer?.card,
        answer: gameState.lastAnswer?.answer,
      });
    }
  } else {
    // Current player takes 1 drink (+ truco penalties if any)
    const trucoCount = gameState.trucoVotes.length;
    const totalDrinks = 1 + trucoCount;
    
    emitDrinkEvent(io, gameState.roomId, {
      id: uuidv4(),
      type: 'take',
      targetPlayerIds: [currentPlayer.id],
      sourcePlayerId: currentPlayer.id,
      sourcePlayerName: currentPlayer.nickname,
      amount: totalDrinks,
      reason: trucoCount > 0 
        ? `${currentPlayer.nickname} answered incorrectly! (+${trucoCount} Truco penalty)`
        : `${currentPlayer.nickname} answered incorrectly!`,
      timestamp: Date.now(),
      card: gameState.lastAnswer?.card,
      answer: gameState.lastAnswer?.answer,
    });
  }
  
  // Reset truco state
  gameState.awaitingTruco = false;
  gameState.trucoVotes = [];
  gameState.trucoSkips = [];
  
  // Move to next player or question
  advanceQuestionPhase(io, room);
}

// Check if all players (except current player) have made their Truco decision
function checkTrucoPhaseComplete(io: SocketIOServer, room: Room) {
  const { gameState } = room;
  
  if (!gameState.awaitingTruco) return;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
  
  // Count how many have voted or skipped
  const decidedCount = gameState.trucoVotes.length + gameState.trucoSkips.length;
  
  // If all other players have decided, auto-proceed
  if (decidedCount >= otherPlayers.length) {
    const correct = gameState.lastAnswer?.correct ?? false;
    processAnswerResult(io, room, correct);
  }
}

function advanceQuestionPhase(io: SocketIOServer, room: Room) {
  const { gameState } = room;
  const playerCount = gameState.players.length;
  const questionCount = getQuestionCount(gameState.difficulty);
  
  // Move to next player
  gameState.currentPlayerIndex++;
  
  // If all players answered this question
  if (gameState.currentPlayerIndex >= playerCount) {
    gameState.currentPlayerIndex = 0;
    gameState.currentQuestionIndex++;
    
    // If all questions answered
    if (gameState.currentQuestionIndex >= questionCount) {
      // Move to revelation phase
      gameState.phase = 'revelation';
      gameState.currentPyramidRow = 0;
      gameState.currentPyramidCard = 0;
    }
  }
  
  gameState.lastAnswer = null;
  broadcastGameState(io, gameState.roomId);
}

function handlePyramidReveal(io: SocketIOServer, room: Room) {
  const { gameState } = room;
  
  if (gameState.phase !== 'revelation') return;
  
  const row = gameState.pyramid[gameState.currentPyramidRow];
  if (!row) return;
  
  const card = row.cards[gameState.currentPyramidCard];
  if (!card || card.faceUp) return;
  
  // Reveal the card
  gameState.pyramid = revealPyramidCard(
    gameState.pyramid,
    gameState.currentPyramidRow,
    gameState.currentPyramidCard
  );
  
  const revealedCard = { ...card, faceUp: true };
  gameState.revealedCard = revealedCard;
  
  // Calculate drinks
  const playerHands = gameState.players.map(p => ({
    playerId: p.id,
    hand: p.hand,
  }));
  
  const { matchesFound, drinkAssignments } = calculatePyramidDrinks(
    row,
    card,
    playerHands,
    gameState.players.map(p => p.id)
  );
  
  // Track which players have matches for gift rows
  const matchingPlayerIds = drinkAssignments
    .filter(a => a.type === 'distribute')
    .map(a => a.playerId);
  
  // For gift rows (row.isDistribute === true), send different overlays:
  // - Matching players: gift overlay to distribute drinks
  // - Non-matching players: "getting excited" overlay
  if (row.isDistribute && matchingPlayerIds.length > 0) {
    // Collect total drinks per matching player
    const playerDrinkTotals: Map<string, number> = new Map();
    for (const assignment of drinkAssignments) {
      if (assignment.type === 'distribute') {
        playerDrinkTotals.set(
          assignment.playerId,
          (playerDrinkTotals.get(assignment.playerId) || 0) + assignment.amount
        );
      }
    }
    
    // Emit gift overlay for each matching player (they can distribute)
    for (const [playerId, amount] of playerDrinkTotals) {
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        player.drinksToDistribute += amount;
        
        emitDrinkEvent(io, gameState.roomId, {
          id: uuidv4(),
          type: 'distribute',
          targetPlayerIds: [playerId],
          sourcePlayerId: playerId,
          sourcePlayerName: player.nickname,
          amount: amount,
          reason: `Matched card in gift Row ${row.rowNumber}!`,
          timestamp: Date.now(),
          card: revealedCard,
        });
      }
    }
    
    // Emit "getting excited" overlay for non-matching players
    const nonMatchingPlayerIds = gameState.players
      .filter(p => !matchingPlayerIds.includes(p.id))
      .map(p => p.id);
    
    if (nonMatchingPlayerIds.length > 0) {
      // Get all matching player names for the message
      const matchingPlayerNames = matchingPlayerIds
        .map(id => gameState.players.find(p => p.id === id)?.nickname)
        .filter(Boolean) as string[];
      
      // Format names: "Player1", "Player1 & Player2", or "Player1, Player2 & Player3"
      let namesList: string;
      if (matchingPlayerNames.length === 1) {
        namesList = matchingPlayerNames[0];
      } else if (matchingPlayerNames.length === 2) {
        namesList = `${matchingPlayerNames[0]} & ${matchingPlayerNames[1]}`;
      } else {
        const lastPlayer = matchingPlayerNames.pop();
        namesList = `${matchingPlayerNames.join(', ')} & ${lastPlayer}`;
      }
      
      for (const playerId of nonMatchingPlayerIds) {
        const verb = matchingPlayerNames.length > 1 ? 'are' : 'is';
        emitDrinkEvent(io, gameState.roomId, {
          id: uuidv4(),
          type: 'excited',
          targetPlayerIds: [playerId],
          sourcePlayerId: matchingPlayerIds[0],
          sourcePlayerName: namesList, // All matching player names
          amount: matchingPlayerNames.length, // Number of excited players (for overlay to use)
          reason: `${namesList} ${verb} getting excited!...`,
          timestamp: Date.now(),
          card: revealedCard,
        });
      }
    }
  } else {
    // Regular drink rows or no matches - original behavior
    for (const assignment of drinkAssignments) {
      if (assignment.type === 'take') {
        emitDrinkEvent(io, gameState.roomId, {
          id: uuidv4(),
          type: 'take',
          targetPlayerIds: [assignment.playerId],
          amount: assignment.amount,
          reason: matchesFound 
            ? `Matched card in Row ${row.rowNumber}!`
            : `No matches - everyone drinks!`,
          timestamp: Date.now(),
          card: revealedCard,
        });
      } else {
        // Give drinks to distribute
        const player = gameState.players.find(p => p.id === assignment.playerId);
        if (player) {
          player.drinksToDistribute += assignment.amount;
        }
      }
    }
  }
  
  // Move to next card
  gameState.currentPyramidCard++;
  
  // If row complete
  if (gameState.currentPyramidCard >= row.cards.length) {
    gameState.currentPyramidCard = 0;
    gameState.currentPyramidRow++;
    
    // If pyramid complete
    if (gameState.currentPyramidRow >= gameState.pyramid.length) {
      gameState.phase = 'ended';
    }
  }
  
  broadcastGameState(io, gameState.roomId);
}

function handleDistributeDrinks(
  io: SocketIOServer,
  room: Room,
  sourcePlayerId: string,
  targetPlayerIds: string[],
  amount: number
) {
  const { gameState } = room;
  const sourcePlayer = gameState.players.find(p => p.id === sourcePlayerId);
  
  if (!sourcePlayer || sourcePlayer.drinksToDistribute < amount) return;
  
  sourcePlayer.drinksToDistribute -= amount;
  
  // Distribute evenly or allow multiple targets
  const drinksPerTarget = Math.floor(amount / targetPlayerIds.length);
  
  if (drinksPerTarget > 0) {
    // Send 'take' event to recipients so they get the "sharing love" overlay
    emitDrinkEvent(io, gameState.roomId, {
      id: uuidv4(),
      type: 'take',
      targetPlayerIds,
      sourcePlayerId,
      sourcePlayerName: sourcePlayer.nickname,
      amount: drinksPerTarget,
      reason: `${sourcePlayer.nickname} is sharing the love!`,
      timestamp: Date.now(),
    });
  }
  
  broadcastGameState(io, gameState.roomId);
}

function startNewGame(io: SocketIOServer, room: Room) {
  const { gameState } = room;
  
  // Reset for new game
  gameState.replayVotes = {};
  gameState.dealerAskedReplay = false;
  gameState.drinkEvents = [];
  gameState.lastAnswer = null;
  gameState.revealedCard = null;
  
  // Reset ready status (except dealer)
  for (const player of gameState.players) {
    player.isReady = player.isDealer;
  }
  
  gameState.phase = 'lobby';
  broadcastGameState(io, gameState.roomId);
}

// Get list of open lobbies for lobby browser
function getOpenLobbies(): LobbyInfo[] {
  const openLobbies: LobbyInfo[] = [];
  
  rooms.forEach((room) => {
    // Only include lobbies in lobby phase with available spots
    if (room.gameState.phase === 'lobby' && room.gameState.players.length < 10) {
      const host = room.gameState.players.find(p => p.isDealer);
      openLobbies.push({
        roomId: room.id,
        hostName: host?.nickname || 'Unknown',
        playerCount: room.gameState.players.length,
        maxPlayers: 10,
        difficulty: room.gameState.difficulty,
      });
    }
  });
  
  return openLobbies;
}

function broadcastLobbies(io: SocketIOServer) {
  io.emit('lobbies:update', getOpenLobbies());
}

// Main server setup
const httpServer = createServer();
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://xerekinha-frontend.onrender.com',
      'https://xerekinha-preview-frontend.onrender.com',
      'https://game.cassianosantos.com'
    ],
    methods: ['GET', 'POST'],
  },
});

// Session cleanup interval - removes expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionToken, session] of playerSessions.entries()) {
    if (session.expiresAt > 0 && session.expiresAt < now) {
      // Session expired - remove player from room
      const room = rooms.get(session.roomId);
      if (room) {
        const player = room.gameState.players.find(p => p.id === session.playerId);
        room.gameState.players = room.gameState.players.filter(p => p.id !== session.playerId);
        if (player) {
          io.to(session.roomId).emit('room:playerLeft', session.playerId);
          console.log(`Session expired for player ${player.nickname} in room ${session.roomId}`);
        }
        // If room is empty, delete it
        if (room.gameState.players.length === 0) {
          rooms.delete(session.roomId);
        } else if (player?.isDealer) {
          // Assign new dealer
          room.gameState.players[0].isDealer = true;
          room.gameState.players[0].isReady = true;
        }
        broadcastGameState(io, session.roomId);
        broadcastLobbies(io);
      }
      playerSessions.delete(sessionToken);
    }
  }
}, 10000); // Check every 10 seconds

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log('Client connected:', socket.id);

  socket.on('room:create', (nickname, callback) => {
    const roomId = generateRoomId();
    const gameState = createInitialGameState(roomId);
    const player = createPlayer(socket.id, nickname, true);
    
    gameState.players.push(player);
    
    const room: Room = {
      id: roomId,
      gameState,
      createdAt: Date.now(),
    };
    
    rooms.set(roomId, room);
    playerRooms.set(socket.id, roomId);
    socket.join(roomId);
    
    // Create session token for reconnection
    const sessionToken = uuidv4();
    playerSessions.set(sessionToken, {
      playerId: player.id,
      roomId,
      expiresAt: 0, // No expiry while connected
    });
    
    callback(roomId, undefined, sessionToken);
    broadcastGameState(io, roomId);
    broadcastLobbies(io); // Update lobby browser
  });

  socket.on('room:join', (roomId, nickname, callback) => {
    const room = rooms.get(roomId.toUpperCase());
    
    if (!room) {
      callback(false, 'Room not found');
      return;
    }
    
    if (room.gameState.phase !== 'lobby') {
      callback(false, 'Game has already started');
      return;
    }
    
    if (room.gameState.players.length >= 10) {
      callback(false, 'Room is full');
      return;
    }
    
    const player = createPlayer(socket.id, nickname, false);
    room.gameState.players.push(player);
    playerRooms.set(socket.id, roomId.toUpperCase());
    socket.join(roomId.toUpperCase());
    
    // Create session token for reconnection
    const sessionToken = uuidv4();
    playerSessions.set(sessionToken, {
      playerId: player.id,
      roomId: roomId.toUpperCase(),
      expiresAt: 0, // No expiry while connected
    });
    
    callback(true, undefined, sessionToken);
    io.to(roomId.toUpperCase()).emit('room:playerJoined', player);
    broadcastGameState(io, roomId.toUpperCase());
    broadcastLobbies(io); // Update lobby browser
  });

  // Reconnect to existing session
  socket.on('room:reconnect', (sessionToken, callback) => {
    const session = playerSessions.get(sessionToken);
    if (!session) {
      callback(false, 'Session not found or expired');
      return;
    }
    
    const room = rooms.get(session.roomId);
    if (!room) {
      playerSessions.delete(sessionToken);
      callback(false, 'Room no longer exists');
      return;
    }
    
    const player = room.gameState.players.find(p => p.id === session.playerId);
    if (!player) {
      playerSessions.delete(sessionToken);
      callback(false, 'Player no longer in room');
      return;
    }
    
    // Reconnect the player
    player.socketId = socket.id;
    player.isConnected = true;
    session.expiresAt = 0; // Clear expiry
    
    playerRooms.set(socket.id, session.roomId);
    socket.join(session.roomId);
    
    console.log(`Player ${player.nickname} reconnected to room ${session.roomId}`);
    
    callback(true, undefined, room.gameState);
    io.to(session.roomId).emit('room:playerReconnected', player.id);
    broadcastGameState(io, session.roomId);
  });

  // Lobby browser - get list of open lobbies
  socket.on('lobbies:list', (callback) => {
    callback(getOpenLobbies());
  });

  socket.on('room:leave', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    // Delete the player's session (intentional leave, no grace period)
    for (const [token, session] of playerSessions.entries()) {
      if (session.playerId === player.id && session.roomId === roomId) {
        playerSessions.delete(token);
        break;
      }
    }
    
    room.gameState.players = room.gameState.players.filter(p => p.socketId !== socket.id);
    playerRooms.delete(socket.id);
    socket.leave(roomId);
    
    io.to(roomId).emit('room:playerLeft', player.id);
    
    // If room is empty, delete it
    if (room.gameState.players.length === 0) {
      rooms.delete(roomId);
    } else if (player.isDealer) {
      // Assign new dealer
      room.gameState.players[0].isDealer = true;
      room.gameState.players[0].isReady = true;
    }
    
    broadcastGameState(io, roomId);
    broadcastLobbies(io);
  });

  socket.on('game:setReady', (ready) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    player.isReady = ready;
    broadcastGameState(io, roomId);
  });

  socket.on('game:setDifficulty', (difficulty) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player?.isDealer) return;
    
    room.gameState.difficulty = difficulty;
    broadcastGameState(io, roomId);
  });

  socket.on('game:setTruco', (enabled) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player?.isDealer) return;
    
    room.gameState.trucoEnabled = enabled;
    broadcastGameState(io, roomId);
  });

  socket.on('game:start', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player?.isDealer) return;
    
    // Check all players ready
    const allReady = room.gameState.players.every(p => p.isReady);
    if (!allReady) {
      socket.emit('room:error', 'Not all players are ready');
      return;
    }
    
    if (room.gameState.players.length < 2) {
      socket.emit('room:error', 'Need at least 2 players');
      return;
    }
    
    setupGame(room);
    broadcastGameState(io, roomId);
  });

  socket.on('game:answer', (answer) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || room.gameState.phase !== 'questions') return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== player.id) return;
    
    handleAnswer(io, room, player.id, answer);
    broadcastGameState(io, roomId);
  });

  socket.on('game:truco', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState.awaitingTruco) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id === player.id) return; // Can't truco yourself
    
    // Check if already voted or skipped
    if (room.gameState.trucoVotes.some(v => v.playerId === player.id)) return;
    if (room.gameState.trucoSkips.includes(player.id)) return;
    
    const vote: TrucoVote = {
      playerId: player.id,
      playerName: player.nickname,
    };
    
    room.gameState.trucoVotes.push(vote);
    io.to(roomId).emit('game:trucoCall', vote);
    
    // Check if all other players have decided
    checkTrucoPhaseComplete(io, room);
    broadcastGameState(io, roomId);
  });

  socket.on('game:skipTruco', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState.awaitingTruco) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id === player.id) return; // Current player doesn't vote
    
    // Check if already voted or skipped
    if (room.gameState.trucoVotes.some(v => v.playerId === player.id)) return;
    if (room.gameState.trucoSkips.includes(player.id)) return;
    
    room.gameState.trucoSkips.push(player.id);
    
    // Check if all other players have decided
    checkTrucoPhaseComplete(io, room);
    broadcastGameState(io, roomId);
  });

  socket.on('game:confirmTruco', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState.awaitingTruco) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player?.isDealer) return;
    
    const correct = room.gameState.lastAnswer?.correct ?? false;
    processAnswerResult(io, room, correct);
  });

  socket.on('game:revealPyramidCard', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player?.isDealer) return;
    
    handlePyramidReveal(io, room);
  });

  socket.on('game:distributeDrinks', (targetPlayerIds, amount) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    handleDistributeDrinks(io, room, player.id, targetPlayerIds, amount);
  });

  socket.on('game:requestReplay', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || room.gameState.phase !== 'ended') return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player?.isDealer) return;
    
    room.gameState.dealerAskedReplay = true;
    room.gameState.replayVotes = {};
    room.gameState.replayVotes[player.id] = true; // Dealer auto-yes
    
    io.to(roomId).emit('game:replayVoteRequest');
    broadcastGameState(io, roomId);
  });

  socket.on('game:voteReplay', (vote) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState.dealerAskedReplay) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    room.gameState.replayVotes[player.id] = vote;
    
    // Check if all voted
    const allVoted = room.gameState.players.every(p => 
      room.gameState.replayVotes.hasOwnProperty(p.id)
    );
    
    if (allVoted) {
      const yesVoters = Object.entries(room.gameState.replayVotes)
        .filter(([_, v]) => v)
        .map(([id]) => id);
      
      if (yesVoters.length >= 2) {
        // Remove players who voted no
        room.gameState.players = room.gameState.players.filter(p => 
          room.gameState.replayVotes[p.id]
        );
        
        io.to(roomId).emit('game:replayResult', true, yesVoters);
        startNewGame(io, room);
      } else {
        io.to(roomId).emit('game:replayResult', false, yesVoters);
      }
    }
    
    broadcastGameState(io, roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (player) {
      player.isConnected = false;
      
      // Set session expiry for grace period
      for (const [token, session] of playerSessions.entries()) {
        if (session.playerId === player.id && session.roomId === roomId) {
          session.expiresAt = Date.now() + SESSION_GRACE_PERIOD;
          console.log(`Player ${player.nickname} disconnected, grace period started (${SESSION_GRACE_PERIOD / 1000}s)`);
          break;
        }
      }
      
      // Emit playerDisconnected (temporary) instead of playerLeft (permanent)
      io.to(roomId).emit('room:playerDisconnected', player.id);
      broadcastGameState(io, roomId);
    }
    
    playerRooms.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
