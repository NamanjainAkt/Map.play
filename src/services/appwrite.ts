import { Client, Account, Databases, Realtime, Query } from 'appwrite';

const PROJECT_ID = 'YOUR_APPWRITE_PROJECT_ID';
const DATABASE_ID = 'mapplay';
const PLAYERS_COLLECTION = 'players';
const TERRITORIES_COLLECTION = 'territories';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const realtime = new Realtime(client);

export const APPWRITE_CONFIG = {
  PROJECT_ID,
  DATABASE_ID,
  PLAYERS_COLLECTION,
  TERRITORIES_COLLECTION,
};

export const QUERIES = {
  LIMIT_50: [Query.limit(50)],
  ORDER_DESC: [Query.orderDesc('score')],
};

export { client, Query };
