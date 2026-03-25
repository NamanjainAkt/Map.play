import { create } from 'zustand';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  position: Coordinate;
  trail: Coordinate[];
  territory: Coordinate[][];
  score: number;
  isAlive: boolean;
}

interface GameState {
  player: Player | null;
  otherPlayers: Player[];
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameover';
  currentTile: { x: number; y: number } | null;
  
  // Actions
  setPlayer: (player: Player) => void;
  updatePlayerPosition: (position: Coordinate) => void;
  addTrailPoint: (point: Coordinate) => void;
  clearTrail: () => void;
  setTerritory: (territory: Coordinate[][]) => void;
  addTerritory: (polygon: Coordinate[]) => void;
  updateScore: (score: number) => void;
  setGameStatus: (status: 'menu' | 'playing' | 'paused' | 'gameover') => void;
  setCurrentTile: (tile: { x: number; y: number }) => void;
  setOtherPlayers: (players: Player[]) => void;
  killPlayer: (playerId: string) => void;
  respawnPlayer: () => void;
}

const generatePlayerId = () => Math.random().toString(36).substring(2, 15);

const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

const getRandomColor = () => PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

export const useGameStore = create<GameState>((set) => ({
  player: null,
  otherPlayers: [],
  gameStatus: 'menu',
  currentTile: null,

  setPlayer: (player) => set({ player }),
  
  updatePlayerPosition: (position) =>
    set((state) => ({
      player: state.player ? { ...state.player, position } : null,
    })),

  addTrailPoint: (point) =>
    set((state) => ({
      player: state.player
        ? { ...state.player, trail: [...state.player.trail, point] }
        : null,
    })),

  clearTrail: () =>
    set((state) => ({
      player: state.player ? { ...state.player, trail: [] } : null,
    })),

  setTerritory: (territory) =>
    set((state) => ({
      player: state.player ? { ...state.player, territory } : null,
    })),

  addTerritory: (polygon) =>
    set((state) => ({
      player: state.player
        ? { ...state.player, territory: [...state.player.territory, polygon] }
        : null,
    })),

  updateScore: (score) =>
    set((state) => ({
      player: state.player ? { ...state.player, score } : null,
    })),

  setGameStatus: (status) => set({ gameStatus: status }),

  setCurrentTile: (tile) => set({ currentTile: tile }),

  setOtherPlayers: (players) => set({ otherPlayers: players }),

  killPlayer: (playerId) =>
    set((state) => {
      if (state.player?.id === playerId) {
        return { player: { ...state.player, isAlive: false } };
      }
      return {
        otherPlayers: state.otherPlayers.map((p) =>
          p.id === playerId ? { ...p, isAlive: false } : p
        ),
      };
    }),

  respawnPlayer: () =>
    set((state) => ({
      player: state.player
        ? {
            ...state.player,
            isAlive: true,
            trail: [],
            position: state.player.territory[0]?.[0] || state.player.position,
          }
        : null,
    })),
}));

export const createNewPlayer = (name: string, startPosition: Coordinate): Player => ({
  id: generatePlayerId(),
  name,
  color: getRandomColor(),
  position: startPosition,
  trail: [],
  territory: [[startPosition]],
  score: 0,
  isAlive: true,
});
