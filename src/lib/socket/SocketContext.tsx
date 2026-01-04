'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  GameState, 
  Player, 
  Difficulty, 
  DrinkEvent,
  TrucoVote,
  ClientToServerEvents,
  ServerToClientEvents,
  LobbyInfo
} from '@/lib/game-engine/types';

// Session persistence constants
const SESSION_STORAGE_KEY = 'xerekinha-session';

interface StoredSession {
  token: string;
  roomId: string;
  nickname: string;
}

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  isReconnecting: boolean;
  gameState: GameState | null;
  currentPlayer: Player | null;
  error: string | null;
  pendingDrink: DrinkEvent | null;
  // Room actions
  createRoom: (nickname: string) => Promise<string | null>;
  joinRoom: (roomId: string, nickname: string) => Promise<boolean>;
  leaveRoom: () => void;
  // Game actions
  setReady: (ready: boolean) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setTruco: (enabled: boolean) => void;
  startGame: () => void;
  answerQuestion: (answer: string) => void;
  callTruco: () => void;
  skipTruco: () => void;
  confirmTrucoPhase: () => void;
  revealPyramidCard: () => void;
  distributeDrinks: (targetPlayerIds: string[], amount: number) => void;
  requestReplay: () => void;
  voteReplay: (vote: boolean) => void;
  // Lobby browser
  getOpenLobbies: () => Promise<LobbyInfo[]>;
  onLobbiesUpdate: (callback: (lobbies: LobbyInfo[]) => void) => () => void;
  // Event handlers
  onDrinkEvent: (callback: (event: DrinkEvent) => void) => () => void;
  clearPendingDrink: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDrink, setPendingDrink] = useState<DrinkEvent | null>(null);
  const [drinkEventCallbacks, setDrinkEventCallbacks] = useState<Set<(event: DrinkEvent) => void>>(new Set());
  const sessionTokenRef = useRef<string | null>(null);
  
  // Use ref to access currentPlayer in event handlers
  const currentPlayerRef = useRef<Player | null>(null);
  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Only attempt reconnection if THIS tab had an active session
      // We use sessionStorage (tab-specific) to track if we were previously connected
      const wasConnectedInThisTab = sessionStorage.getItem('xerekinha-tab-active');
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      
      // Only reconnect if:
      // 1. There's a stored session in localStorage
      // 2. This specific tab was previously connected (or it's a page refresh)
      if (storedSession && wasConnectedInThisTab) {
        try {
          const session: StoredSession = JSON.parse(storedSession);
          setIsReconnecting(true);
          newSocket.emit('room:reconnect', session.token, (success, error, gameState) => {
            setIsReconnecting(false);
            if (success && gameState) {
              sessionTokenRef.current = session.token;
              setGameState(gameState);
              const player = gameState.players.find(p => p.socketId === newSocket.id);
              setCurrentPlayer(player || null);
              console.log('Reconnected to session successfully');
            } else {
              // Session invalid, clear it
              localStorage.removeItem(SESSION_STORAGE_KEY);
              sessionStorage.removeItem('xerekinha-tab-active');
              sessionTokenRef.current = null;
              console.log('Session expired or invalid:', error);
            }
          });
        } catch {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          sessionStorage.removeItem('xerekinha-tab-active');
          sessionTokenRef.current = null;
        }
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('room:error', (message) => {
      setError(message);
    });

    newSocket.on('game:stateUpdate', (state) => {
      setGameState(state);
      // Update current player reference
      if (state && newSocket.id) {
        const player = state.players.find(p => p.socketId === newSocket.id);
        setCurrentPlayer(player || null);
      }
    });

    newSocket.on('room:joined', (state) => {
      setGameState(state);
      if (state && newSocket.id) {
        const player = state.players.find(p => p.socketId === newSocket.id);
        setCurrentPlayer(player || null);
      }
    });

    newSocket.on('room:playerJoined', (player) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, player],
        };
      });
    });

    newSocket.on('room:playerLeft', (playerId) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== playerId),
        };
      });
    });

    // Handle temporary disconnection (player may reconnect)
    newSocket.on('room:playerDisconnected', (playerId) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId ? { ...p, isConnected: false } : p
          ),
        };
      });
    });

    // Handle player reconnection
    newSocket.on('room:playerReconnected', (playerId) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId ? { ...p, isConnected: true } : p
          ),
        };
      });
    });

    newSocket.on('game:drinkEvent', (event) => {
      // Set pending drink if current player is target
      if (currentPlayerRef.current && event.targetPlayerIds.includes(currentPlayerRef.current.id)) {
        setPendingDrink(event);
      }
      drinkEventCallbacks.forEach(cb => cb(event));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (nickname: string): Promise<string | null> => {
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit('room:create', nickname, (roomId, error, sessionToken) => {
        if (error || !roomId) {
          setError(error || 'Failed to create room');
          resolve(null);
        } else {
          // Store session for reconnection
          if (sessionToken) {
            sessionTokenRef.current = sessionToken;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
              token: sessionToken,
              roomId,
              nickname,
            }));
            // Mark this tab as having an active session (for reconnection on refresh)
            sessionStorage.setItem('xerekinha-tab-active', 'true');
          }
          resolve(roomId);
        }
      });
    });
  }, [socket]);

  const joinRoom = useCallback(async (roomId: string, nickname: string): Promise<boolean> => {
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit('room:join', roomId, nickname, (success, error, sessionToken) => {
        if (error || !success) {
          setError(error || 'Failed to join room');
          resolve(false);
        } else {
          // Store session for reconnection
          if (sessionToken) {
            sessionTokenRef.current = sessionToken;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
              token: sessionToken,
              roomId: roomId.toUpperCase(),
              nickname,
            }));
            // Mark this tab as having an active session (for reconnection on refresh)
            sessionStorage.setItem('xerekinha-tab-active', 'true');
          }
          resolve(true);
        }
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('room:leave');
    // Clear session on intentional leave
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem('xerekinha-tab-active');
    sessionTokenRef.current = null;
    setGameState(null);
    setCurrentPlayer(null);
  }, [socket]);

  const setReady = useCallback((ready: boolean) => {
    if (!socket) return;
    socket.emit('game:setReady', ready);
  }, [socket]);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    if (!socket) return;
    socket.emit('game:setDifficulty', difficulty);
  }, [socket]);

  const setTruco = useCallback((enabled: boolean) => {
    if (!socket) return;
    socket.emit('game:setTruco', enabled);
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('game:start');
  }, [socket]);

  const answerQuestion = useCallback((answer: string) => {
    if (!socket) return;
    socket.emit('game:answer', answer);
  }, [socket]);

  const callTruco = useCallback(() => {
    if (!socket) return;
    socket.emit('game:truco');
  }, [socket]);

  const skipTruco = useCallback(() => {
    if (!socket) return;
    socket.emit('game:skipTruco');
  }, [socket]);

  const confirmTrucoPhase = useCallback(() => {
    if (!socket) return;
    socket.emit('game:confirmTruco');
  }, [socket]);

  const revealPyramidCard = useCallback(() => {
    if (!socket) return;
    socket.emit('game:revealPyramidCard');
  }, [socket]);

  const distributeDrinks = useCallback((targetPlayerIds: string[], amount: number) => {
    if (!socket) return;
    socket.emit('game:distributeDrinks', targetPlayerIds, amount);
  }, [socket]);

  const requestReplay = useCallback(() => {
    if (!socket) return;
    socket.emit('game:requestReplay');
  }, [socket]);

  const voteReplay = useCallback((vote: boolean) => {
    if (!socket) return;
    socket.emit('game:voteReplay', vote);
  }, [socket]);

  const onDrinkEvent = useCallback((callback: (event: DrinkEvent) => void) => {
    setDrinkEventCallbacks(prev => new Set(prev).add(callback));
    return () => {
      setDrinkEventCallbacks(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPendingDrink = useCallback(() => {
    setPendingDrink(null);
  }, []);

  // Lobby browser methods
  const getOpenLobbies = useCallback((): Promise<LobbyInfo[]> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve([]);
        return;
      }
      socket.emit('lobbies:list', (lobbies) => {
        resolve(lobbies);
      });
    });
  }, [socket]);

  const lobbiesCallbacks = useRef<Set<(lobbies: LobbyInfo[]) => void>>(new Set());

  const onLobbiesUpdate = useCallback((callback: (lobbies: LobbyInfo[]) => void) => {
    lobbiesCallbacks.current.add(callback);
    return () => {
      lobbiesCallbacks.current.delete(callback);
    };
  }, []);

  // Listen for lobbies updates
  useEffect(() => {
    if (!socket) return;
    
    const handleLobbiesUpdate = (lobbies: LobbyInfo[]) => {
      lobbiesCallbacks.current.forEach(cb => cb(lobbies));
    };
    
    socket.on('lobbies:update', handleLobbiesUpdate);
    
    return () => {
      socket.off('lobbies:update', handleLobbiesUpdate);
    };
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    isReconnecting,
    gameState,
    currentPlayer,
    error,
    pendingDrink,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    setDifficulty,
    setTruco,
    startGame,
    answerQuestion,
    callTruco,
    skipTruco,
    confirmTrucoPhase,
    revealPyramidCard,
    distributeDrinks,
    requestReplay,
    voteReplay,
    getOpenLobbies,
    onLobbiesUpdate,
    onDrinkEvent,
    clearPendingDrink,
    clearError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
