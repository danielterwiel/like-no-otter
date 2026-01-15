import { Platform } from "react-native";
import * as schema from "./schema";

const DATABASE_NAME = "likenootter.db";

// Placeholder type for web compatibility
type DrizzleDB = ReturnType<typeof import("drizzle-orm/expo-sqlite").drizzle>;

// On web, we create a mock db object since SQLite isn't available
// The actual db is initialized lazily on native platforms
let _db: DrizzleDB | null = null;

function createWebMockDb(): DrizzleDB {
  // Return a proxy that throws helpful errors on web
  return new Proxy({} as DrizzleDB, {
    get(_target, prop) {
      if (prop === "then") return undefined; // Allow await to work
      throw new Error(
        `Database operations are not available on web. Property accessed: ${String(prop)}`,
      );
    },
  });
}

async function initializeDb(): Promise<DrizzleDB> {
  if (_db) return _db;

  if (Platform.OS === "web") {
    _db = createWebMockDb();
    return _db;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const expo = SQLite.openDatabaseSync(DATABASE_NAME);
  _db = drizzle(expo, { schema });
  return _db;
}

// For backwards compatibility, export a getter that initializes lazily
// This will throw on web if db operations are attempted
export const db = new Proxy({} as DrizzleDB, {
  get(_target, prop) {
    if (prop === "then") return undefined;
    if (Platform.OS === "web") {
      throw new Error(
        `Database operations are not available on web. Property accessed: ${String(prop)}`,
      );
    }
    // For native, we need synchronous access - this is a known limitation
    // The DatabaseProvider ensures migrations complete before db is used
    throw new Error("Database not initialized. Ensure DatabaseProvider has completed loading.");
  },
});

export { initializeDb };
export type Database = DrizzleDB;
