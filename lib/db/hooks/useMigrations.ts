import { useEffect, useState } from "react";
import { Platform } from "react-native";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

const MIGRATIONS = [
  // Migration 001: Initial schema
  `CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    total_volume REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL,
    synced_to_healthkit INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    primary_muscles TEXT NOT NULL,
    secondary_muscles TEXT,
    is_custom INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight REAL,
    reps INTEGER,
    is_warmup INTEGER DEFAULT 0,
    completed_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time INTEGER,
    end_time INTEGER,
    synced_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'none',
    is_completed INTEGER DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected',
    connected_at INTEGER,
    last_sync_at INTEGER,
    sync_error TEXT
  )`,
  // Migration 002: Whoop integration tables
  `CREATE TABLE IF NOT EXISTS whoop_recovery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whoop_id TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    recovery_score INTEGER,
    hrv_rmssd REAL,
    resting_heart_rate INTEGER,
    spo2 REAL,
    skin_temp REAL,
    synced_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS whoop_sleep (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whoop_id TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    quality_duration INTEGER,
    rem_duration INTEGER,
    deep_duration INTEGER,
    light_duration INTEGER,
    awake_duration INTEGER,
    respiratory_rate REAL,
    synced_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS whoop_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whoop_id TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    strain REAL,
    kilojoules REAL,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    synced_at INTEGER NOT NULL
  )`,
  // Migration 005: Strong exercise mappings table
  `CREATE TABLE IF NOT EXISTS strong_exercise_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strong_name TEXT NOT NULL UNIQUE,
    exercise_id INTEGER,
    is_skipped INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
];

// Migrations that may fail (e.g., ALTER TABLE if column exists) - run outside transaction
const SAFE_MIGRATIONS = [
  // Migration 003: Add metadata column to connections for storing service-specific config
  `ALTER TABLE connections ADD COLUMN metadata TEXT`,
  // Migration 004: Add TickTick sync columns to tasks table
  `ALTER TABLE tasks ADD COLUMN ticktick_id TEXT`,
  `ALTER TABLE tasks ADD COLUMN ticktick_project_id TEXT`,
  `ALTER TABLE tasks ADD COLUMN ticktick_etag TEXT`,
  `ALTER TABLE tasks ADD COLUMN modified_at INTEGER`,
  `ALTER TABLE tasks ADD COLUMN is_deleted INTEGER DEFAULT 0`,
];

export function useMigrations() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function runMigrations() {
      // Skip SQLite on web - expo-sqlite doesn't support web
      if (IS_WEB) {
        setIsReady(true);
        return;
      }

      try {
        // Dynamic import to avoid loading native module on web
        const SQLite = await import("expo-sqlite");
        const db = SQLite.openDatabaseSync(DATABASE_NAME);

        // Run all migrations in a transaction
        db.withTransactionSync(() => {
          for (const migration of MIGRATIONS) {
            db.runSync(migration);
          }
        });

        // Run safe migrations (may fail if already applied)
        for (const migration of SAFE_MIGRATIONS) {
          try {
            db.runSync(migration);
          } catch {
            // Ignore - column may already exist
          }
        }

        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Migration failed"));
      }
    }

    runMigrations();
  }, []);

  return { isReady, error };
}
