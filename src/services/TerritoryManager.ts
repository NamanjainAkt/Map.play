import type { Coordinate } from '../stores/gameStore';
import { pointInPolygon, polygonArea, simplifyPolygon, isSelfIntersecting } from '../utils/geometry';
import { coordinateToTile } from '../utils/grid';

export interface TerritoryInfo {
  id: string;
  polygon: Coordinate[];
  ownerId: string;
  area: number;
}

const GRID_SIZE_DEGREES = 0.01;

export class TerritoryManager {
  private territories: Map<string, TerritoryInfo> = new Map();
  private playerTerritory: Map<string, Coordinate[]> = new Map();

  constructor() {
    this.initializeGrid();
  }

  private initializeGrid(): void {
    for (let x = -180; x < 180; x += GRID_SIZE_DEGREES) {
      for (let y = -90; y < 90; y += GRID_SIZE_DEGREES) {
        const key = `${x},${y}`;
        this.territories.set(key, {
          id: key,
          polygon: [
            { latitude: y, longitude: x },
            { latitude: y + GRID_SIZE_DEGREES, longitude: x },
            { latitude: y + GRID_SIZE_DEGREES, longitude: x + GRID_SIZE_DEGREES },
            { latitude: y, longitude: x + GRID_SIZE_DEGREES },
          ],
          ownerId: '',
          area: GRID_SIZE_DEGREES * GRID_SIZE_DEGREES * 111 * 111,
        });
      }
    }
  }

  isOnOwnTerritory(position: Coordinate, territory: Coordinate[][]): boolean {
    for (const poly of territory) {
      if (pointInPolygon(position, poly)) {
        return true;
      }
    }
    return false;
  }

  detectLoop(
    trail: Coordinate[],
    territory: Coordinate[][]
  ): Coordinate[] | null {
    if (trail.length < 10) return null;
    
    if (!this.isOnOwnTerritory(trail[trail.length - 1], territory)) {
      return null;
    }

    if (isSelfIntersecting(trail)) {
      return null;
    }

    const loopStart = trail[0];
    const loopEnd = trail[trail.length - 1];
    
    for (let i = 0; i < trail.length - 5; i++) {
      const dist = Math.sqrt(
        Math.pow(loopEnd.latitude - trail[i].latitude, 2) +
        Math.pow(loopEnd.longitude - trail[i].longitude, 2)
      );
      
      if (dist < GRID_SIZE_DEGREES * 2) {
        const loopPolygon = trail.slice(i);
        const area = polygonArea(loopPolygon);
        
        if (area > GRID_SIZE_DEGREES * GRID_SIZE_DEGREES) {
          return simplifyPolygon(loopPolygon, 0.00005);
        }
      }
    }

    return null;
  }

  captureTerritory(
    loopPolygon: Coordinate[],
    currentTerritory: Coordinate[][]
  ): Coordinate[][] {
    const capturedTiles: Coordinate[][] = [];
    
    const bounds = {
      minLat: Math.min(...loopPolygon.map(p => p.latitude)),
      maxLat: Math.max(...loopPolygon.map(p => p.latitude)),
      minLng: Math.min(...loopPolygon.map(p => p.longitude)),
      maxLng: Math.max(...loopPolygon.map(p => p.longitude)),
    };

    for (let lat = bounds.minLat; lat < bounds.maxLat; lat += GRID_SIZE_DEGREES) {
      for (let lng = bounds.minLng; lng < bounds.maxLng; lng += GRID_SIZE_DEGREES) {
        const tileCenter: Coordinate = {
          latitude: lat + GRID_SIZE_DEGREES / 2,
          longitude: lng + GRID_SIZE_DEGREES / 2,
        };

        if (pointInPolygon(tileCenter, loopPolygon)) {
          const tilePolygon: Coordinate[] = [
            { latitude: lat, longitude: lng },
            { latitude: lat + GRID_SIZE_DEGREES, longitude: lng },
            { latitude: lat + GRID_SIZE_DEGREES, longitude: lng + GRID_SIZE_DEGREES },
            { latitude: lat, longitude: lng + GRID_SIZE_DEGREES },
          ];
          
          capturedTiles.push(tilePolygon);
        }
      }
    }

    return [...currentTerritory, ...capturedTiles];
  }

  calculateTerritoryScore(territory: Coordinate[][]): number {
    let totalArea = 0;
    for (const poly of territory) {
      totalArea += polygonArea(poly);
    }
    return Math.floor(totalArea * 1000000);
  }

  getTileAtPosition(position: Coordinate): string {
    const tile = coordinateToTile(position.latitude, position.longitude);
    return `${tile.x},${tile.y}`;
  }

  getTilePolygon(tileX: number, tileY: number): Coordinate[] {
    return [
      { latitude: tileY * GRID_SIZE_DEGREES, longitude: tileX * GRID_SIZE_DEGREES },
      { latitude: (tileY + 1) * GRID_SIZE_DEGREES, longitude: tileX * GRID_SIZE_DEGREES },
      { latitude: (tileY + 1) * GRID_SIZE_DEGREES, longitude: (tileX + 1) * GRID_SIZE_DEGREES },
      { latitude: tileY * GRID_SIZE_DEGREES, longitude: (tileX + 1) * GRID_SIZE_DEGREES },
    ];
  }

  mergeTerritories(territories: Coordinate[][]): Coordinate[][] {
    if (territories.length === 0) return [];
    if (territories.length === 1) return territories;

    const merged: Coordinate[][] = [territories[0]];
    
    for (let i = 1; i < territories.length; i++) {
      const current = territories[i];
      let mergedAny = false;
      
      for (let j = 0; j < merged.length; j++) {
        if (this.canMerge(merged[j], current)) {
          merged[j] = this.mergeTwoPolygons(merged[j], current);
          mergedAny = true;
          break;
        }
      }
      
      if (!mergedAny) {
        merged.push(current);
      }
    }

    return merged;
  }

  private canMerge(poly1: Coordinate[], poly2: Coordinate[]): boolean {
    for (const point of poly2) {
      if (pointInPolygon(point, poly1)) return true;
    }
    for (const point of poly1) {
      if (pointInPolygon(point, poly2)) return true;
    }
    return false;
  }

  private mergeTwoPolygons(poly1: Coordinate[], poly2: Coordinate[]): Coordinate[] {
    const allPoints = [...poly1, ...poly2];
    const bounds = {
      minLat: Math.min(...allPoints.map(p => p.latitude)),
      maxLat: Math.max(...allPoints.map(p => p.latitude)),
      minLng: Math.min(...allPoints.map(p => p.longitude)),
      maxLng: Math.max(...allPoints.map(p => p.longitude)),
    };

    return [
      { latitude: bounds.minLat, longitude: bounds.minLng },
      { latitude: bounds.maxLat, longitude: bounds.minLng },
      { latitude: bounds.maxLat, longitude: bounds.maxLng },
      { latitude: bounds.minLat, longitude: bounds.maxLng },
    ];
  }
}

export const territoryManager = new TerritoryManager();
