import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from '../../src/components/map/MapView';
import Joystick from '../../src/components/game/Joystick';
import Territory from '../../src/components/game/Territory';
import { useGameStore, createNewPlayer, type Coordinate, type Player } from '../../src/stores/gameStore';
import { coordinateToTile } from '../../src/utils/grid';
import { territoryManager } from '../../src/services/TerritoryManager';
import { useMultiplayer, type MultiplayerPlayer } from '../../src/hooks/useMultiplayer';

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
  const [notification, setNotification] = useState<string | null>(null);
  const [userId] = useState<string | null>(null);
  
  const movementRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTrailTime = useRef<number>(0);
  const wasOnTerritory = useRef<boolean>(true);
  
  const {
    player,
    updatePlayerPosition,
    addTrailPoint,
    clearTrail,
    setPlayer,
    setGameStatus,
    setCurrentTile,
    updateScore,
    setTerritory,
    setOtherPlayers,
  } = useGameStore();

  const { nearbyPlayers, connectionStatus } = useMultiplayer({
    currentTile: useGameStore.getState().currentTile,
    userId,
    onPlayerJoined: (p) => console.log('Player joined:', p.name),
    onPlayerLeft: (id) => console.log('Player left:', id),
  });

  useEffect(() => {
    setOtherPlayers(nearbyPlayers.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      position: p.position,
      trail: p.trail,
      territory: [],
      score: p.score,
      isAlive: p.isAlive,
    })));
  }, [nearbyPlayers, setOtherPlayers]);

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    const newLocation = { latitude: lat, longitude: lng };
    setCurrentLocation(newLocation);
    
    if (!player && isPlaying) {
      const newPlayer = createNewPlayer(playerName, newLocation);
      setPlayer(newPlayer);
      const tile = coordinateToTile(lat, lng);
      setCurrentTile(tile);
      wasOnTerritory.current = true;
    }
  }, [player, isPlaying, playerName, setPlayer, setCurrentTile]);

  const startGame = useCallback(() => {
    const startPosition = player?.position || currentLocation;
    if (!player) {
      const newPlayer = createNewPlayer(playerName, startPosition);
      setPlayer(newPlayer);
    }
    wasOnTerritory.current = true;
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

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
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

            const onOwnTerritory = territoryManager.isOnOwnTerritory(newPos, player.territory);
            
            if (wasOnTerritory.current && !onOwnTerritory) {
              wasOnTerritory.current = false;
            }
            
            if (!wasOnTerritory.current && onOwnTerritory && player.trail.length > 10) {
              const loopPolygon = territoryManager.detectLoop(player.trail, player.territory);
              
              if (loopPolygon) {
                const newTerritory = territoryManager.captureTerritory(loopPolygon, player.territory);
                const mergedTerritory = territoryManager.mergeTerritories(newTerritory);
                setTerritory(mergedTerritory);
                
                const newScore = territoryManager.calculateTerritoryScore(mergedTerritory);
                updateScore(newScore);
                
                const capturedCount = mergedTerritory.length - player.territory.length;
                if (capturedCount > 0) {
                  showNotification(`+${capturedCount} tiles captured!`);
                }
                
                clearTrail();
                wasOnTerritory.current = true;
              }
            }
            
            if (onOwnTerritory) {
              wasOnTerritory.current = true;
            }
          }
        }
      }, 16);
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, player, updatePlayerPosition, addTrailPoint, setCurrentTile, updateScore, setTerritory, clearTrail, showNotification]);

  const trailCoordinates = useMemo(() => {
    if (!player || player.trail.length === 0) return [];
    return player.trail;
  }, [player?.trail]);

  const otherPlayersOnMap = useGameStore.getState().otherPlayers;

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
            <Territory polygons={player.territory} color={player.color} />
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

        {otherPlayersOnMap.map((otherPlayer) => (
          <React.Fragment key={otherPlayer.id}>
            <Marker
              coordinate={otherPlayer.position}
              title={otherPlayer.name}
              icon={{
                color: otherPlayer.color,
              }}
            />
            {otherPlayer.trail.length > 1 && (
              <Polyline
                coordinates={otherPlayer.trail}
                strokeColor={otherPlayer.color}
                strokeWidth={3}
                strokeOpacity={0.7}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {notification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}

      {connectionStatus === 'connected' && isPlaying && (
        <View style={styles.multiplayerStatus}>
          <Text style={styles.multiplayerText}>🟢 {nearbyPlayers.length} nearby</Text>
        </View>
      )}

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
  notification: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  multiplayerStatus: {
    position: 'absolute',
    top: 120,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  multiplayerText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
});
