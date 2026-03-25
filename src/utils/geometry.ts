import type { Coordinate } from '../stores/gameStore';

export function pointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    
    const intersect = ((yi > point.latitude) !== (yj > point.latitude)) &&
      (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export function polygonArea(coords: Coordinate[]): number {
  let area = 0;
  const n = coords.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i].longitude * coords[j].latitude;
    area -= coords[j].longitude * coords[i].latitude;
  }
  
  return Math.abs(area / 2);
}

export function isClockwise(polygon: Coordinate[]): boolean {
  let sum = 0;
  const n = polygon.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (polygon[j].longitude - polygon[i].longitude) * (polygon[j].latitude + polygon[i].latitude);
  }
  
  return sum > 0;
}

export function simplifyPolygon(coords: Coordinate[], tolerance: number = 0.0001): Coordinate[] {
  if (coords.length <= 2) return coords;
  
  const sqDist = (p1: Coordinate, p2: Coordinate) => {
    const dx = p1.longitude - p2.longitude;
    const dy = p1.latitude - p2.latitude;
    return dx * dx + dy * dy;
  };
  
  const sqTolerance = tolerance * tolerance;
  
  let prevPoint = coords[0];
  const newPoints = [prevPoint];
  
  for (let i = 1; i < coords.length - 1; i++) {
    const point = coords[i];
    if (sqDist(prevPoint, point) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }
  
  newPoints.push(coords[coords.length - 1]);
  return newPoints;
}

export function getPolygonBounds(polygon: Coordinate[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  
  for (const point of polygon) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }
  
  return { minLat, maxLat, minLng, maxLng };
}

export function polygonsIntersect(poly1: Coordinate[], poly2: Coordinate[]): boolean {
  for (const point of poly2) {
    if (pointInPolygon(point, poly1)) return true;
  }
  for (const point of poly1) {
    if (pointInPolygon(point, poly2)) return true;
  }
  return false;
}

export function lineSegmentsIntersect(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): boolean {
  const det = (p2.longitude - p1.longitude) * (p4.latitude - p3.latitude) -
    (p4.longitude - p3.longitude) * (p2.latitude - p1.latitude);
  
  if (det === 0) return false;
  
  const lambda = ((p4.latitude - p3.latitude) * (p4.longitude - p1.longitude) +
    (p3.longitude - p4.longitude) * (p4.latitude - p1.latitude)) / det;
  const gamma = ((p1.latitude - p2.latitude) * (p4.longitude - p1.longitude) +
    (p2.longitude - p1.longitude) * (p4.latitude - p1.latitude)) / det;
  
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

export function isSelfIntersecting(trail: Coordinate[]): boolean {
  if (trail.length < 4) return false;
  
  for (let i = 0; i < trail.length - 3; i++) {
    for (let j = i + 2; j < trail.length - 1; j++) {
      if (lineSegmentsIntersect(trail[i], trail[i + 1], trail[j], trail[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

export function getIntersectionPoint(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): Coordinate | null {
  const det = (p2.longitude - p1.longitude) * (p4.latitude - p3.latitude) -
    (p4.longitude - p3.longitude) * (p2.latitude - p1.latitude);
  
  if (det === 0) return null;
  
  const t = ((p3.longitude - p1.longitude) * (p4.latitude - p3.latitude) -
    (p3.latitude - p1.latitude) * (p4.longitude - p3.longitude)) / det;
  
  return {
    latitude: p1.latitude + t * (p2.latitude - p1.latitude),
    longitude: p1.longitude + t * (p2.longitude - p1.longitude),
  };
}
