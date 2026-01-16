import { Platform } from "react-native";
import type { WorkoutExerciseState } from "@/lib/workout";
import type { MuscleGroup } from "@/constants/exercises";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

export interface WorkoutRecord {
  id: number;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  totalVolume: number;
  notes: string | null;
  createdAt: Date;
  syncedToHealthKit: boolean;
}

export interface SaveWorkoutInput {
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  exercises: WorkoutExerciseState[];
  notes?: string;
}

export interface SaveWorkoutResult {
  success: boolean;
  workoutId?: number;
  error?: string;
}

/**
 * Calculate total volume (weight × reps) for all sets
 */
export function calculateTotalVolume(exercises: WorkoutExerciseState[]): number {
  return exercises.reduce((total, exerciseState) => {
    return (
      total +
      exerciseState.sets.reduce((setTotal, set) => {
        if (set.isWarmup) return setTotal; // Exclude warmup sets from volume
        const weight = set.weight ?? 0;
        const reps = set.reps ?? 0;
        return setTotal + weight * reps;
      }, 0)
    );
  }, 0);
}

/**
 * Get unique muscle groups trained in the workout
 */
export function getTrainedMuscleGroups(exercises: WorkoutExerciseState[]): MuscleGroup[] {
  const muscleSet = new Set<MuscleGroup>();

  for (const exerciseState of exercises) {
    for (const muscle of exerciseState.exercise.primaryMuscles) {
      muscleSet.add(muscle);
    }
    for (const muscle of exerciseState.exercise.secondaryMuscles) {
      muscleSet.add(muscle);
    }
  }

  return Array.from(muscleSet);
}

/**
 * Get total sets count (excluding warmups)
 */
export function getTotalSetsCount(exercises: WorkoutExerciseState[]): number {
  return exercises.reduce((total, exerciseState) => {
    return total + exerciseState.sets.filter((set) => !set.isWarmup).length;
  }, 0);
}

/**
 * Save a completed workout to the database
 */
export async function saveWorkout(input: SaveWorkoutInput): Promise<SaveWorkoutResult> {
  if (IS_WEB) {
    return { success: false, error: "Database not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const totalVolume = calculateTotalVolume(input.exercises);
    const now = new Date();

    // Use a transaction to ensure all inserts succeed or fail together
    let workoutId: number | undefined;

    db.withTransactionSync(() => {
      // Insert workout
      db.runSync(
        `INSERT INTO workouts (start_time, end_time, duration_seconds, total_volume, notes, created_at, synced_to_healthkit)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        Math.floor(input.startTime.getTime() / 1000),
        Math.floor(input.endTime.getTime() / 1000),
        input.durationSeconds,
        totalVolume,
        input.notes ?? null,
        Math.floor(now.getTime() / 1000),
        0, // Not synced to HealthKit yet
      );

      // Get the inserted workout ID
      const result = db.getFirstSync<{ id: number }>("SELECT last_insert_rowid() as id");
      workoutId = result?.id;

      if (!workoutId) {
        throw new Error("Failed to get workout ID");
      }

      // Insert workout exercises and sets
      for (let orderIndex = 0; orderIndex < input.exercises.length; orderIndex++) {
        const exerciseState = input.exercises[orderIndex];

        // Insert workout_exercise
        db.runSync(
          `INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
           VALUES (?, ?, ?)`,
          workoutId,
          exerciseState.exercise.id,
          orderIndex,
        );

        // Get the workout_exercise ID
        const exerciseResult = db.getFirstSync<{ id: number }>("SELECT last_insert_rowid() as id");
        const workoutExerciseId = exerciseResult?.id;

        if (!workoutExerciseId) {
          throw new Error("Failed to get workout exercise ID");
        }

        // Insert sets for this exercise
        for (const set of exerciseState.sets) {
          db.runSync(
            `INSERT INTO workout_sets (workout_exercise_id, set_number, weight, reps, is_warmup, completed_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            workoutExerciseId,
            set.setNumber,
            set.weight,
            set.reps,
            set.isWarmup ? 1 : 0,
            set.completedAt ? Math.floor(set.completedAt.getTime() / 1000) : null,
          );
        }
      }
    });

    return { success: true, workoutId };
  } catch (error) {
    console.error("Failed to save workout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
