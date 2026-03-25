import type { Coordinate } from '../stores/gameStore';
import { lineSegmentsIntersect } from './geometry';

const COLLISION_THRESHOLD = 0.0001;

export function checkTrailCollision(
  playerPosition: Coordinate,
  playerTrail: Coordinate[],
  enemyTrails: Coordinate[][]
): { collided: boolean; enemyIndex: number; trailIndex: number } {
  if (playerTrail.length < 2 || enemyTrails.length === 0) {
    return { collided: false, enemyIndex: -1, trailIndex: -1 };
  }

  const playerHead = playerTrail[playerTrail.length - 1];
  const playerPrev = playerTrail[playerTrail.length - 2];

  for (let e = 0; e < enemyTrails.length; e++) {
    const enemyTrail = enemyTrails[e];
    if (enemyTrail.length < 2) continue;

    for (let t = 0; t < enemyTrail.length - 1; t++) {
      const enemyPoint1 = enemyTrail[t];
      const enemyPoint2 = enemyTrail[t + 1];

      if (lineSegmentsIntersect(playerHead, playerPrev, enemyPoint1, enemyPoint2)) {
        return { collided: true, enemyIndex: e, trailIndex: t };
      }

      const distToEnemy = distanceBetween(playerHead, enemyPoint1);
      if (distToEnemy < COLLISION_THRESHOLD) {
        return { collided: true, enemyIndex: e, trailIndex: t };
      }
    }
  }

  return { collided: false, enemyIndex: -1, trailIndex: -1 };
}

export function checkTrailSelfCollision(
  trail: Coordinate[]
): boolean {
  if (trail.length < 4) return false;

  const head = trail[trail.length - 1];
  const prev = trail[trail.length - 2];

  for (let i = 0; i < trail.length - 3; i++) {
    if (lineSegmentsIntersect(head, prev, trail[i], trail[i + 1])) {
      return true;
    }
  }

  return false;
}

export function checkHeadToEnemyTrailCollision(
  playerHead: Coordinate,
  playerPrev: Coordinate,
  enemyTrails: Coordinate[][]
): { collided: boolean; enemyIndex: number; trailIndex: number } {
  for (let e = 0; e < enemyTrails.length; e++) {
    const enemyTrail = enemyTrails[e];
    if (enemyTrail.length < 2) continue;

    for (let t = 0; t < enemyTrail.length - 1; t++) {
      const enemyPoint1 = enemyTrail[t];
      const enemyPoint2 = enemyTrail[t + 1];

      if (lineSegmentsIntersect(playerHead, playerPrev, enemyPoint1, enemyPoint2)) {
        return { collided: true, enemyIndex: e, trailIndex: t };
      }
    }
  }

  return { collided: false, enemyIndex: -1, trailIndex: -1 };
}

export function checkPlayerVsPlayerCollision(
  playerHead: Coordinate,
  playerPrev: Coordinate,
  enemyHead: Coordinate,
  enemyPrev: Coordinate
): boolean {
  return lineSegmentsIntersect(playerHead, playerPrev, enemyHead, enemyPrev);
}

export function checkBoundaryCollision(
  position: Coordinate,
  minLat: number = -90,
  maxLat: number = 90,
  minLng: number = -180,
  maxLng: number = 180
): boolean {
  return (
    position.latitude < minLat ||
    position.latitude > maxLat ||
    position.longitude < minLng ||
    position.longitude > maxLng
  );
}

function distanceBetween(p1: Coordinate, p2: Coordinate): number {
  const dx = p1.latitude - p2.latitude;
  const dy = p1.longitude - p2.longitude;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isPointOnTrail(
  point: Coordinate,
  trail: Coordinate[],
  threshold: number = COLLISION_THRESHOLD
): boolean {
  for (let i = 0; i < trail.length - 1; i++) {
    const dist = pointToSegmentDistance(point, trail[i], trail[i + 1]);
    if (dist < threshold) {
      return true;
    }
  }
  return false;
}

function pointToSegmentDistance(
  point: Coordinate,
  segStart: Coordinate,
  segEnd: Coordinate
): number {
  const dx = segEnd.longitude - segStart.longitude;
  const dy = segEnd.latitude - segStart.latitude;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return distanceBetween(point, segStart);
  }

  let t = ((point.longitude - segStart.longitude) * dx + (point.latitude - segStart.latitude) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const proj = {
    latitude: segStart.latitude + t * dy,
    longitude: segStart.longitude + t * dx,
  };

  return distanceBetween(point, proj);
}
