import { useCallback, useRef } from 'react';
import { useFrameCallback } from 'react-native-reanimated';
import type { Coordinate } from '../stores/gameStore';

const PLAYER_SPEED = 0.00005;

interface MovementInput {
  x: number;
  y: number;
}

interface UsePlayerMovementProps {
  onPositionUpdate: (position: Coordinate) => void;
  onTrailUpdate: (point: Coordinate) => void;
  isPlaying: boolean;
}

export function usePlayerMovement({
  onPositionUpdate,
  onTrailUpdate,
  isPlaying,
}: UsePlayerMovementProps) {
  const currentPosition = useRef<Coordinate>({ latitude: 0, longitude: 0 });
  const movementInput = useRef<MovementInput>({ x: 0, y: 0 });
  const lastTrailTime = useRef<number>(0);

  const setMovementInput = useCallback((input: MovementInput) => {
    movementInput.current = input;
  }, []);

  const setPosition = useCallback((position: Coordinate) => {
    currentPosition.current = position;
  }, []);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (!isPlaying) return;
    
    const input = movementInput.current;
    if (input.x === 0 && input.y === 0) return;

    const deltaTime = frameInfo.timeSincePreviousFrame ?? 16;
    const speedFactor = deltaTime / 16;
    
    const newLat = currentPosition.current.latitude + (input.y * PLAYER_SPEED * speedFactor);
    const newLng = currentPosition.current.longitude + (input.x * PLAYER_SPEED * speedFactor);

    currentPosition.current = {
      latitude: newLat,
      longitude: newLng,
    };

    const now = Date.now();
    if (now - lastTrailTime.current > 100) {
      lastTrailTime.current = now;
      onTrailUpdate(currentPosition.current);
    }
    
    onPositionUpdate(currentPosition.current);
  });

  return {
    setMovementInput,
    setPosition,
  };
}
