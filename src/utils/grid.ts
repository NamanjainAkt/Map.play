import type { Coordinate } from '../stores/gameStore';

const TILE_SIZE_KM = 1; // 1km x 1km tiles

const EARTH_CIRCUMFERENCE_KM = 40075;

export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export function tileToLatLng(x: number, y: number, zoom: number): Coordinate {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { latitude: lat, longitude: lng };
}

export function getTileBounds(x: number, y: number, zoom: number): {
  northEast: Coordinate;
  southWest: Coordinate;
} {
  const northWest = tileToLatLng(x, y, zoom);
  const southEast = tileToLatLng(x + 1, y + 1, zoom);
  return {
    northEast: { latitude: northWest.latitude, longitude: southEast.longitude },
    southWest: { latitude: southEast.latitude, longitude: northWest.longitude },
  };
}

export function coordinateToTile(
  lat: number,
  lng: number,
  tileSizeDegrees: number = TILE_SIZE_KM / 111 // Approximate degrees per km
): { x: number; y: number } {
  return {
    x: Math.floor(lng / tileSizeDegrees),
    y: Math.floor(lat / tileSizeDegrees),
  };
}

export function tileToCoordinate(
  x: number,
  y: number,
  tileSizeDegrees: number = TILE_SIZE_KM / 111
): Coordinate {
  return {
    latitude: y * tileSizeDegrees + tileSizeDegrees / 2,
    longitude: x * tileSizeDegrees + tileSizeDegrees / 2,
  };
}

export function isInSameTile(
  coord1: Coordinate,
  coord2: Coordinate,
  tileSizeDegrees: number = TILE_SIZE_KM / 111
): boolean {
  const tile1 = coordinateToTile(coord1.latitude, coord1.longitude, tileSizeDegrees);
  const tile2 = coordinateToTile(coord2.latitude, coord2.longitude, tileSizeDegrees);
  return tile1.x === tile2.x && tile1.y === tile2.y;
}

export function getNearbyTiles(
  centerTile: { x: number; y: number },
  radius: number = 2
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      tiles.push({ x: centerTile.x + dx, y: centerTile.y + dy });
    }
  }
  return tiles;
}

export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
