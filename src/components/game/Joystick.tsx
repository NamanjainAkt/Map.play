import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ReactNativeJoystick, type IReactNativeJoystickEvent } from '@korsolutions/react-native-joystick';

interface JoystickProps {
  onMove?: (data: { x: number; y: number }) => void;
  onStop?: () => void;
  radius?: number;
  color?: string;
}

export default function Joystick({
  onMove,
  onStop,
  radius = 75,
  color = '#06b6d4',
}: JoystickProps) {
  const handleMove = useCallback(
    (data: IReactNativeJoystickEvent) => {
      onMove?.({
        x: data.position?.x ?? 0,
        y: data.position?.y ?? 0,
      });
    },
    [onMove]
  );

  const handleStop = useCallback(() => {
    onStop?.();
  }, [onStop]);

  return (
    <View style={styles.container}>
      <ReactNativeJoystick
        radius={radius}
        color={color}
        onMove={handleMove}
        onStop={handleStop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 40,
  },
});
