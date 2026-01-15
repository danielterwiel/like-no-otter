import { Platform } from "react-native";
import type { MuscleGroup, ExerciseCategory } from "@/constants/exercises";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

export interface ExerciseRecord {
  id: number;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  isCustom: boolean;
}

function parseExerciseRow(row: {
  id: number;
  name: string;
  category: string;
  primary_muscles: string;
  secondary_muscles: string | null;
  is_custom: number;
}): ExerciseRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ExerciseCategory,
    primaryMuscles: row.primary_muscles.split(",").filter(Boolean) as MuscleGroup[],
    secondaryMuscles: row.secondary_muscles
      ? (row.secondary_muscles.split(",").filter(Boolean) as MuscleGroup[])
      : [],
    isCustom: row.is_custom === 1,
  };
}

/**
 * Query all exercises from the database
 */
export async function getAllExercises(): Promise<ExerciseRecord[]> {
  if (IS_WEB) {
    return [];
  }

  const SQLite = await import("expo-sqlite");
  const db = SQLite.openDatabaseSync(DATABASE_NAME);

  const rows = db.getAllSync<{
    id: number;
    name: string;
    category: string;
    primary_muscles: string;
    secondary_muscles: string | null;
    is_custom: number;
  }>("SELECT * FROM exercises ORDER BY name");

  return rows.map(parseExerciseRow);
}

/**
 * Query exercises by muscle group (checks both primary and secondary muscles)
 */
export async function getExercisesByMuscle(muscle: MuscleGroup): Promise<ExerciseRecord[]> {
  if (IS_WEB) {
    return [];
  }

  const SQLite = await import("expo-sqlite");
  const db = SQLite.openDatabaseSync(DATABASE_NAME);

  // Use LIKE to find exercises where the muscle is in the comma-separated list
  const rows = db.getAllSync<{
    id: number;
    name: string;
    category: string;
    primary_muscles: string;
    secondary_muscles: string | null;
    is_custom: number;
  }>(
    `SELECT * FROM exercises
     WHERE primary_muscles LIKE ? OR secondary_muscles LIKE ?
     ORDER BY name`,
    `%${muscle}%`,
    `%${muscle}%`,
  );

  return rows.map(parseExerciseRow);
}

/**
 * Query exercises by category
 */
export async function getExercisesByCategory(
  category: ExerciseCategory,
): Promise<ExerciseRecord[]> {
  if (IS_WEB) {
    return [];
  }

  const SQLite = await import("expo-sqlite");
  const db = SQLite.openDatabaseSync(DATABASE_NAME);

  const rows = db.getAllSync<{
    id: number;
    name: string;
    category: string;
    primary_muscles: string;
    secondary_muscles: string | null;
    is_custom: number;
  }>("SELECT * FROM exercises WHERE category = ? ORDER BY name", category);

  return rows.map(parseExerciseRow);
}

/**
 * Search exercises by name
 */
export async function searchExercises(query: string): Promise<ExerciseRecord[]> {
  if (IS_WEB) {
    return [];
  }

  const SQLite = await import("expo-sqlite");
  const db = SQLite.openDatabaseSync(DATABASE_NAME);

  const rows = db.getAllSync<{
    id: number;
    name: string;
    category: string;
    primary_muscles: string;
    secondary_muscles: string | null;
    is_custom: number;
  }>("SELECT * FROM exercises WHERE name LIKE ? ORDER BY name", `%${query}%`);

  return rows.map(parseExerciseRow);
}

/**
 * Get exercise count
 */
export async function getExerciseCount(): Promise<number> {
  if (IS_WEB) {
    return 0;
  }

  const SQLite = await import("expo-sqlite");
  const db = SQLite.openDatabaseSync(DATABASE_NAME);

  const result = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM exercises");

  return result?.count ?? 0;
}
