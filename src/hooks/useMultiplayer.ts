import { useEffect, useCallback, useRef, useState } from 'react';
import { realtime, APPWRITE_CONFIG } from '../services/appwrite';
import type { Coordinate } from '../stores/gameStore';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  position: Coordinate;
  trail: Coordinate[];
  color: string;
  score: number;
  isAlive: boolean;
}

interface UseMultiplayerProps {
  currentTile: { x: number; y: number } | null;
  userId: string | null;
  onPlayerJoined?: (player: MultiplayerPlayer) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerUpdate?: (player: MultiplayerPlayer) => void;
}

export function useMultiplayer({
  currentTile,
  userId,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerUpdate,
}: UseMultiplayerProps) {
  const [nearbyPlayers, setNearbyPlayers] = useState<MultiplayerPlayer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  const unsubscribeRef = useRef<ReturnType<typeof Function> | null>(null);
  const playerCacheRef = useRef<Map<string, MultiplayerPlayer>>(new Map());

  const subscribeToChannel = useCallback((tileX: number, tileY: number) => {
    if (unsubscribeRef.current) {
      (unsubscribeRef.current as any)();
    }

    setConnectionStatus('connecting');

    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.PLAYERS_COLLECTION}.documents`;
    
    try {
      let subscription: any;
      subscription = realtime.subscribe(channel, (response: any) => {
        const events = response.events;
        const payload = response.payload;

        if (!payload || payload.$id === userId) return;

        const tileKey = payload.currentTile;
        if (!tileKey) return;

        const [px, py] = tileKey.split(',').map(Number);
        const distance = Math.sqrt(Math.pow(px - tileX, 2) + Math.pow(py - tileY, 2));
        
        if (distance > 2) return;

        if (events.some((e: string) => e.includes('create'))) {
          const newPlayer: MultiplayerPlayer = {
            id: payload.$id,
            name: payload.name || 'Unknown',
            position: JSON.parse(payload.position || '{}'),
            trail: [],
            color: payload.color || '#FF6B6B',
            score: payload.score || 0,
            isAlive: payload.isAlive !== false,
          };
          playerCacheRef.current.set(newPlayer.id, newPlayer);
          setNearbyPlayers(Array.from(playerCacheRef.current.values()));
          onPlayerJoined?.(newPlayer);
        } 
        else if (events.some((e: string) => e.includes('delete'))) {
          playerCacheRef.current.delete(payload.$id);
          setNearbyPlayers(Array.from(playerCacheRef.current.values()));
          onPlayerLeft?.(payload.$id);
        }
        else if (events.some((e: string) => e.includes('update'))) {
          const existing = playerCacheRef.current.get(payload.$id);
          if (existing) {
            const updatedPlayer: MultiplayerPlayer = {
              ...existing,
              position: JSON.parse(payload.position || '{}'),
              score: payload.score || 0,
              isAlive: payload.isAlive !== false,
            };
            playerCacheRef.current.set(payload.$id, updatedPlayer);
            setNearbyPlayers(Array.from(playerCacheRef.current.values()));
            onPlayerUpdate?.(updatedPlayer);
          }
        }
      });

      unsubscribeRef.current = () => subscription?.();
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to subscribe to realtime:', error);
      setConnectionStatus('disconnected');
    }
  }, [userId, onPlayerJoined, onPlayerLeft, onPlayerUpdate]);

  useEffect(() => {
    if (currentTile && userId) {
      subscribeToChannel(currentTile.x, currentTile.y);
    }

    return () => {
      if (unsubscribeRef.current) {
        (unsubscribeRef.current as any)();
        unsubscribeRef.current = null;
      }
    };
  }, [currentTile?.x, currentTile?.y, userId, subscribeToChannel]);

  const interpolatePosition = useCallback((
    oldPosition: Coordinate,
    newPosition: Coordinate,
    factor: number
  ): Coordinate => {
    return {
      latitude: oldPosition.latitude + (newPosition.latitude - oldPosition.latitude) * factor,
      longitude: oldPosition.longitude + (newPosition.longitude - oldPosition.longitude) * factor,
    };
  }, []);

  const predictPosition = useCallback((
    lastPosition: Coordinate,
    velocity: Coordinate,
    timeDelta: number
  ): Coordinate => {
    return {
      latitude: lastPosition.latitude + velocity.latitude * timeDelta,
      longitude: lastPosition.longitude + velocity.longitude * timeDelta,
    };
  }, []);

  const getPlayerById = useCallback((playerId: string): MultiplayerPlayer | undefined => {
    return nearbyPlayers.find(p => p.id === playerId);
  }, [nearbyPlayers]);

  const clearNearbyPlayers = useCallback(() => {
    playerCacheRef.current.clear();
    setNearbyPlayers([]);
  }, []);

  return {
    nearbyPlayers,
    connectionStatus,
    interpolatePosition,
    predictPosition,
    getPlayerById,
    clearNearbyPlayers,
  };
}
