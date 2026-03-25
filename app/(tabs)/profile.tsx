import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '../../src/stores/gameStore';

export default function ProfileScreen() {
  const [playerName, setPlayerName] = useState('Player1');
  const [isEditing, setIsEditing] = useState(false);
  const { player } = useGameStore();

  const handleSaveName = () => {
    if (playerName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters');
      return;
    }
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {playerName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.nameContainer}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={15}
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.playerName}>{playerName}</Text>
              <Text style={styles.editHint}>Tap to edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Score</Text>
          <Text style={styles.statValue}>{player?.score?.toLocaleString() || '0'}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Territory Owned</Text>
          <Text style={styles.statValue}>{player?.territory?.length || 0} tiles</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Games Played</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Win Rate</Text>
          <Text style={styles.statValue}>0%</Text>
        </View>
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Effects</Text>
          <View style={styles.toggle}>
            <Text style={styles.toggleText}>ON</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Vibration</Text>
          <View style={styles.toggle}>
            <Text style={styles.toggleText}>ON</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show My Location</Text>
          <View style={[styles.toggle, styles.toggleActive]}>
            <Text style={styles.toggleText}>ON</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameContainer: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 18,
    minWidth: 150,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  statValue: {
    color: '#06b6d4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  toggle: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleActive: {
    backgroundColor: '#06b6d4',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
