# Appwrite Setup Guide for map.play

## Prerequisites
- Node.js 18+ installed
- An Appwrite Cloud account (free) or self-hosted instance

---

## Step 1: Create Appwrite Project

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Click **"Create Project"**
3. Enter project name: `map.play`
4. Click **Create**
5. Copy the **Project ID** from the project settings

---

## Step 2: Update App Configuration

Open `src/services/appwrite.ts` and replace `YOUR_APPWRITE_PROJECT_ID`:

```typescript
const PROJECT_ID = 'YOUR_ACTUAL_PROJECT_ID_HERE';
```

---

## Step 3: Create Database

1. In Appwrite Console, go to **Databases** (left sidebar)
2. Click **"Create Database"**
3. Name: `mapplay`
4. Click **Create**
5. Copy the **Database ID** (click the copy icon next to the database name)

---

## Step 4: Create Players Collection

1. In the `mapplay` database, click **"Create Collection"**
2. Name: `players`
3. Click **Create**
4. Click **Settings** icon (gear) on the collection
5. Enable **"API Create"**, **"API Read"**, **"API Update"**, **"API Delete"**

### Add Attributes

Click **"Create Attribute"** for each:

| Attribute | Type | Size | Required | Array |
|----------|------|------|----------|-------|
| name | string | 100 | Yes | No |
| email | string | 255 | Yes | No |
| position | string | 500 | Yes | No |
| territory | string | 10000 | Yes | Yes |
| score | integer | - | Yes | No |
| color | string | 20 | Yes | No |
| currentTile | string | 50 | Yes | No |
| lastUpdate | integer | - | Yes | No |
| isAlive | boolean | - | Yes | No |

**Note:** For `territory`, use size 10000 to store large polygon arrays.

---

## Step 5: Create Territories Collection (Optional - for Phase 8+)

1. In the `mapplay` database, click **"Create Collection"**
2. Name: `territories`
3. Click **Create**
4. Enable all API permissions in Settings

### Add Attributes

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| ownerId | string | 100 | Yes |
| polygon | string | 10000 | Yes |
| capturedAt | integer | - | Yes |

---

## Step 6: Update Database ID

Open `src/services/appwrite.ts` and verify:

```typescript
export const APPWRITE_CONFIG = {
  PROJECT_ID: 'your-project-id',
  DATABASE_ID: 'mapplay',  // Should match your database name ID
  PLAYERS_COLLECTION: 'players',
  TERRITORIES_COLLECTION: 'territories',
};
```

---

## Step 7: Test Authentication (Optional)

For user authentication to work:

1. Go to **Auth** → **Settings** in Appwrite Console
2. Enable **Email/Password** provider
3. Set your app domain in **Platforms** (or use localhost for development)

---

## Quick Reference: Collection IDs

After creating collections, the IDs will look like:
- Database ID: `64abc123...`
- Players collection: `64abc124...`
- Territories collection: `64abc125...`

You can find these in the collection settings.

---

## Troubleshooting

### "Document not found" errors
- Check that collection IDs match in `appwrite.ts`

### Authentication not working
- Add your platform (Android/iOS/Web) in Appwrite → Platforms

### Data not syncing
- Check that all attributes are created with correct types
- Verify API permissions are enabled

---

## Environment Variables (Optional)

For production, use environment variables:

```typescript
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID';
```
