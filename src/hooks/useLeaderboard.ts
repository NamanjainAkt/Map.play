import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_CONFIG, QUERIES } from '../services/appwrite';
import type { Coordinate } from '../stores/gameStore';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  territory: number;
  rank: number;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.PLAYERS_COLLECTION,
        [
          ...QUERIES.ORDER_DESC,
          ...QUERIES.LIMIT_50,
        ]
      );

      const entries: LeaderboardEntry[] = response.documents.map((doc: any, index: number) => ({
        id: doc.$id,
        name: doc.name || 'Unknown',
        score: doc.score || 0,
        territory: Array.isArray(doc.territory) ? doc.territory.length : 0,
        rank: index + 1,
      }));

      setLeaderboard(entries);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refresh: fetchLeaderboard,
  };
}
