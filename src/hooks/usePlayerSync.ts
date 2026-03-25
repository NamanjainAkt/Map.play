import { useEffect, useCallback, useRef } from 'react';
import { databases, APPWRITE_CONFIG, realtime, client } from '../services/appwrite';
import type { Coordinate } from '../stores/gameStore';
import type { Models } from 'appwrite';

interface PlayerData {
  id: string;
  name: string;
  email: string;
  position: Coordinate;
  territory: Coordinate[][];
  score: number;
  color: string;
  currentTile: string;
  lastUpdate: number;
}

interface UsePlayerSyncProps {
  userId: string | null;
  onPlayerUpdate?: (players: PlayerData[]) => void;
}

const SYNC_INTERVAL = 500;

export function usePlayerSync({ userId, onPlayerUpdate }: UsePlayerSyncProps) {
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdateRef = useRef<Partial<PlayerData> | null>(null);

  const savePlayerData = useCallback(async (data: PlayerData) => {
    if (!userId) return;

    try {
      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.PLAYERS_COLLECTION,
        userId,
        {
          name: data.name,
          position: JSON.stringify(data.position),
          territory: JSON.stringify(data.territory),
          score: data.score,
          color: data.color,
          currentTile: data.currentTile,
          lastUpdate: Date.now(),
        }
      );
    } catch (error) {
      console.error('Failed to save player data:', error);
    }
  }, [userId]);

  const throttledSave = useCallback((data: PlayerData) => {
    pendingUpdateRef.current = {
      name: data.name,
      position: data.position,
      territory: data.territory,
      score: data.score,
      color: data.color,
      currentTile: data.currentTile,
      lastUpdate: Date.now(),
    };

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (pendingUpdateRef.current && userId) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.PLAYERS_COLLECTION,
            userId,
            pendingUpdateRef.current as Record<string, any>
          );
        } catch (error) {
          console.error('Failed to sync player:', error);
        }
        pendingUpdateRef.current = null;
      }
    }, SYNC_INTERVAL);
  }, [userId]);

  const getNearbyPlayers = useCallback(async (currentTile: string) => {
    if (!userId) return [];

    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.PLAYERS_COLLECTION,
        [
          `notEqual($id, ${userId})`,
          `equal(currentTile, ${currentTile})`,
        ]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        email: doc.email,
        position: JSON.parse(doc.position || '{}'),
        territory: JSON.parse(doc.territory || '[]'),
        score: doc.score || 0,
        color: doc.color || '#FF6B6B',
        currentTile: doc.currentTile || '',
        lastUpdate: doc.lastUpdate || 0,
      }));
    } catch (error) {
      console.error('Failed to get nearby players:', error);
      return [];
    }
  }, [userId]);

  const subscribeToPlayers = useCallback((currentTile: string, callback: (players: PlayerData[]) => void) => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.PLAYERS_COLLECTION}.documents`;
    
    const unsubscribe = realtime.subscribe(channel, (response) => {
      const events = response.events;
      if (events.some((e) => e.includes('update'))) {
        getNearbyPlayers(currentTile).then(callback);
      }
    });

    return unsubscribe;
  }, [getNearbyPlayers]);

  const updatePlayerPosition = useCallback(async (position: Coordinate, currentTile: string) => {
    if (!userId || !pendingUpdateRef.current) return;

    pendingUpdateRef.current.position = position;
    pendingUpdateRef.current.currentTile = currentTile;
    pendingUpdateRef.current.lastUpdate = Date.now();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    savePlayerData,
    throttledSave,
    getNearbyPlayers,
    subscribeToPlayers,
    updatePlayerPosition,
  };
}
