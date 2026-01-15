import { useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "likenootter.db";

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
];

export function useMigrations() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function runMigrations() {
      try {
        const db = SQLite.openDatabaseSync(DATABASE_NAME);

        // Run all migrations in a transaction
        db.withTransactionSync(() => {
          for (const migration of MIGRATIONS) {
            db.runSync(migration);
          }
        });

        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Migration failed"));
      }
    }

    runMigrations();
  }, []);

  return { isReady, error };
}
