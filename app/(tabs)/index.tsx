import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from '../../src/components/map/MapView';
import Joystick from '../../src/components/game/Joystick';
import { useGameStore, createNewPlayer, type Coordinate } from '../../src/stores/gameStore';
import { coordinateToTile } from '../../src/utils/grid';

const PLAYER_SPEED = 0.0001; // degrees per tick

export default function GameScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerName] = useState('Player1');
  const movementRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const {
    player,
    updatePlayerPosition,
    addTrailPoint,
    clearTrail,
    setPlayer,
    setGameStatus,
    gameStatus,
  } = useGameStore();

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    if (!player && isPlaying) {
      const newPlayer = createNewPlayer(playerName, { latitude: lat, longitude: lng });
      setPlayer(newPlayer);
    }
  }, [player, isPlaying, playerName, setPlayer]);

  const startGame = useCallback(() => {
    setIsPlaying(true);
    setGameStatus('playing');
  }, [setGameStatus]);

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameStatus('menu');
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, [setGameStatus]);

  useEffect(() => {
    if (isPlaying && player) {
      animationRef.current = setInterval(() => {
        const movement = movementRef.current;
        if (movement.x !== 0 || movement.y !== 0) {
          const newPos: Coordinate = {
            latitude: player.position.latitude + movement.y * PLAYER_SPEED,
            longitude: player.position.longitude + movement.x * PLAYER_SPEED,
          };
          updatePlayerPosition(newPos);
          addTrailPoint(newPos);
        }
      }, 50);
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, player, updatePlayerPosition, addTrailPoint]);

  const handleJoystickMove = useCallback((data: { x: number; y: number }) => {
    movementRef.current = { x: data.x, y: -data.y };
  }, []);

  const handleJoystickStop = useCallback(() => {
    movementRef.current = { x: 0, y: 0 };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        onLocationUpdate={handleLocationUpdate}
        initialLatitude={51.5074}
        initialLongitude={-0.1278}
        initialZoom={16}
      >
        {player && (
          <>
            <Marker
              coordinate={player.position}
              title={player.name}
              icon={{
                color: player.color,
              }}
            />
            {player.trail.length > 1 && (
              <Polyline
                coordinates={player.trail}
                strokeColor={player.color}
                strokeWidth={3}
              />
            )}
          </>
        )}
      </MapView>

      {isPlaying && player && (
        <Joystick
          onMove={handleJoystickMove}
          onStop={handleJoystickStop}
        />
      )}

      {isPlaying && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {player?.score || 0}</Text>
          <TouchableOpacity style={styles.pauseButton} onPress={stopGame}>
            <Text style={styles.pauseButtonText}>⏸</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isPlaying && (
        <View style={styles.menuContainer}>
          <Text style={styles.title}>map.play</Text>
          <Text style={styles.subtitle}>Capture territory. Defend it. Win.</Text>
          <TouchableOpacity style={styles.playButton} onPress={startGame}>
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 48,
  },
  playButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 64,
    paddingVertical: 16,
    borderRadius: 30,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 18,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  pauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 20,
  },
});
