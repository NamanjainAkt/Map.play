import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  territory: number;
  rank: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'ProPlayer', score: 15420, territory: 89, rank: 1 },
  { id: '2', name: 'TerritoryKing', score: 12350, territory: 72, rank: 2 },
  { id: '3', name: 'SwiftRunner', score: 10890, territory: 65, rank: 3 },
  { id: '4', name: 'CaptureMaster', score: 9540, territory: 58, rank: 4 },
  { id: '5', name: 'TrailBlazer', score: 8200, territory: 51, rank: 5 },
  { id: '6', name: 'GridHunter', score: 7100, territory: 44, rank: 6 },
  { id: '7', name: 'ZoneConqueror', score: 6800, territory: 42, rank: 7 },
  { id: '8', name: 'PixelWarrior', score: 5500, territory: 35, rank: 8 },
  { id: '9', name: 'MapNinja', score: 4200, territory: 28, rank: 9 },
  { id: '10', name: 'NewChallenger', score: 2100, territory: 15, rank: 10 },
];

export default function LeaderboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'global' | 'daily' | 'weekly'>('global');

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles.row, item.rank <= 3 && styles.topThree]}>
      <View style={[styles.rankBadge, item.rank === 1 && styles.goldBadge, item.rank === 2 && styles.silverBadge, item.rank === 3 && styles.bronzeBadge]}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.territoryText}>{item.territory} tiles</Text>
      </View>
      <Text style={styles.scoreText}>{item.score.toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['global', 'daily', 'weekly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.filterButton, selectedPeriod === period && styles.filterActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.filterText, selectedPeriod === period && styles.filterTextActive]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={MOCK_LEADERBOARD}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#06b6d4',
  },
  filterText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  topThree: {
    borderWidth: 2,
    borderColor: '#06b6d4',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  territoryText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  scoreText: {
    color: '#06b6d4',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
