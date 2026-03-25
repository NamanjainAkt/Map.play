import { useEffect, useRef, useCallback } from 'react';
import { useFrameCallback } from 'react-native-reanimated';
import type { Coordinate } from '../stores/gameStore';

export interface GameLoopCallbacks {
  onUpdate: (deltaTime: number) => void;
  onFixedUpdate?: () => void;
}

const FIXED_UPDATE_INTERVAL = 100;

export function useGameLoop({ onUpdate, onFixedUpdate }: GameLoopCallbacks) {
  const lastFrameTime = useRef<number>(0);
  const lastFixedUpdate = useRef<number>(0);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (!lastFrameTime.current) {
      lastFrameTime.current = frameInfo.timeSincePreviousFrame ?? 0;
      return;
    }

    const deltaTime = frameInfo.timeSincePreviousFrame ?? 16;
    lastFrameTime.current = deltaTime;

    onUpdate(deltaTime);

    if (onFixedUpdate) {
      const now = Date.now();
      if (now - lastFixedUpdate.current >= FIXED_UPDATE_INTERVAL) {
        lastFixedUpdate.current = now;
        onFixedUpdate();
      }
    }
  });
}

export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}
