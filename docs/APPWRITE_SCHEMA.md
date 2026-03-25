# Appwrite Database Schema

## Database: mapplay

### Collection: players

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Player display name |
| email | string | Player email (unique) |
| position | string (JSON) | Current position {latitude, longitude} |
| territory | string (JSON) | Array of territory polygons |
| score | integer | Player score |
| color | string | Player color (hex) |
| currentTile | string | Current tile coordinate "x,y" |
| lastUpdate | integer | Unix timestamp of last update |

### Collection: territories

| Attribute | Type | Description |
|-----------|------|-------------|
| ownerId | string | Player ID who owns this |
| polygon | string (JSON) | Territory polygon coordinates |
| capturedAt | integer | Unix timestamp of capture |

## Setup Instructions

1. Create Appwrite project at https://cloud.appwrite.io
2. Create database "mapplay"
3. Create "players" collection with attributes above
4. Create "territories" collection with attributes above
5. Update PROJECT_ID in src/services/appwrite.ts
