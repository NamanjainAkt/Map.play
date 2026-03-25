import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from '../../src/components/map/MapView';
import Joystick from '../../src/components/game/Joystick';
import { useGameStore, createNewPlayer, type Coordinate } from '../../src/stores/gameStore';
import { coordinateToTile, calculateDistance } from '../../src/utils/grid';

const PLAYER_SPEED = 0.00003;
const TRAIL_INTERVAL_MS = 100;
const INITIAL_LATITUDE = 51.5074;
const INITIAL_LONGITUDE = -0.1278;

export default function GameScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerName] = useState('Player1');
  const [currentLocation, setCurrentLocation] = useState<Coordinate>({
    latitude: INITIAL_LATITUDE,
    longitude: INITIAL_LONGITUDE,
  });
  
  const movementRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTrailTime = useRef<number>(0);
  
  const {
    player,
    updatePlayerPosition,
    addTrailPoint,
    clearTrail,
    setPlayer,
    setGameStatus,
    setCurrentTile,
    updateScore,
  } = useGameStore();

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    const newLocation = { latitude: lat, longitude: lng };
    setCurrentLocation(newLocation);
    
    if (!player && isPlaying) {
      const newPlayer = createNewPlayer(playerName, newLocation);
      setPlayer(newPlayer);
      const tile = coordinateToTile(lat, lng);
      setCurrentTile(tile);
    }
  }, [player, isPlaying, playerName, setPlayer, setCurrentTile]);

  const startGame = useCallback(() => {
    const startPosition = player?.position || currentLocation;
    if (!player) {
      const newPlayer = createNewPlayer(playerName, startPosition);
      setPlayer(newPlayer);
    }
    setIsPlaying(true);
    setGameStatus('playing');
  }, [player, currentLocation, playerName, setPlayer, setGameStatus]);

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameStatus('menu');
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, [setGameStatus]);

  const handleJoystickMove = useCallback((data: { x: number; y: number }) => {
    movementRef.current = { x: data.x, y: -data.y };
  }, []);

  const handleJoystickStop = useCallback(() => {
    movementRef.current = { x: 0, y: 0 };
  }, []);

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
          
          const now = Date.now();
          if (now - lastTrailTime.current > TRAIL_INTERVAL_MS) {
            lastTrailTime.current = now;
            addTrailPoint(newPos);
            
            const tile = coordinateToTile(newPos.latitude, newPos.longitude);
            if (tile.x !== player.position.latitude || tile.y !== player.position.longitude) {
              setCurrentTile(tile);
            }
            
            const score = Math.floor(calculateDistance(
              player.territory[0]?.[0] || player.position,
              newPos
            ) * 1000);
            updateScore(score);
          }
        }
      }, 16);
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, player, updatePlayerPosition, addTrailPoint, setCurrentTile, updateScore]);

  const trailCoordinates = useMemo(() => {
    if (!player || player.trail.length === 0) return [];
    return player.trail;
  }, [player?.trail]);

  return (
    <View style={styles.container}>
      <MapView
        onLocationUpdate={handleLocationUpdate}
        initialLatitude={INITIAL_LATITUDE}
        initialLongitude={INITIAL_LONGITUDE}
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
            {trailCoordinates.length > 1 && (
              <Polyline
                coordinates={trailCoordinates}
                strokeColor={player.color}
                strokeWidth={4}
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
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreText}>{player?.score || 0}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>TERRITORY</Text>
            <Text style={styles.scoreText}>{player?.territory?.length || 0}</Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    gap: 8,
  },
  scoreBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
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
