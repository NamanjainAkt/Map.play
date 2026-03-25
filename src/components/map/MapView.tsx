import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { OSMView, type OSMViewRef, Marker, Polyline, Polygon, Circle } from 'expo-osm-sdk';
import * as Location from 'expo-location';

interface MapViewProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  children?: React.ReactNode;
}

const DEFAULT_LATITUDE = 51.5074;
const DEFAULT_LONGITUDE = -0.1278;
const DEFAULT_ZOOM = 15;

export default function MapView({
  onLocationUpdate,
  initialLatitude = DEFAULT_LATITUDE,
  initialLongitude = DEFAULT_LONGITUDE,
  initialZoom = DEFAULT_ZOOM,
  children,
}: MapViewProps) {
  const mapRef = useRef<OSMViewRef>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        getCurrentLocation();
      } else {
        setHasLocationPermission(false);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setHasLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      onLocationUpdate?.(latitude, longitude);
      mapRef.current?.animateToLocation(latitude, longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleMapReady = () => {
    if (userLocation) {
      mapRef.current?.animateToLocation(userLocation.latitude, userLocation.longitude);
    }
  };

  return (
    <View style={styles.container}>
      <OSMView
        ref={mapRef}
        style={styles.map}
        initialCenter={{
          latitude: userLocation?.latitude ?? initialLatitude,
          longitude: userLocation?.longitude ?? initialLongitude,
        }}
        initialZoom={initialZoom}
        onMapReady={handleMapReady}
        showUserLocation={true}
      />
      {children}
      {hasLocationPermission === false && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            Location denied. Using default location.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  permissionBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});

export { Marker, Polyline, Polygon, Circle };
