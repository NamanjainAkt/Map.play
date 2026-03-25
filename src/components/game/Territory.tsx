import React from 'react';
import { Polygon } from 'expo-osm-sdk';
import type { Coordinate } from '../../stores/gameStore';

interface TerritoryProps {
  polygons: Coordinate[][];
  color: string;
}

export default function Territory({ polygons, color }: TerritoryProps) {
  if (!polygons || polygons.length === 0) return null;

  return (
    <>
      {polygons.map((polygon, index) => (
        <Polygon
          key={`territory-${index}`}
          coordinates={polygon}
          fillColor={color}
          fillOpacity={0.3}
          strokeColor={color}
          strokeWidth={2}
        />
      ))}
    </>
  );
}
