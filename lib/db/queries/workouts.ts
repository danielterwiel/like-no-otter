import { Platform } from "react-native";
import type { WorkoutExerciseState } from "@/lib/workout";
import type { MuscleGroup } from "@/constants/exercises";
import { saveWorkoutToHealthKit } from "@/lib/health";

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
];

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
  healthKitSynced?: boolean;
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
export interface WorkoutHistoryItem {
  id: number;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  totalVolume: number;
  exerciseCount: number;
  muscleGroups: string[];
}

/**
 * Fetch workout history sorted by date (newest first)
 */
export async function getWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  if (IS_WEB) {
    return [];
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Get all workouts with exercise counts
    const workouts = db.getAllSync<{
      id: number;
      start_time: number;
      end_time: number;
      duration_seconds: number;
      total_volume: number;
    }>(
      `SELECT id, start_time, end_time, duration_seconds, total_volume
       FROM workouts
       ORDER BY start_time DESC`,
    );

    const result: WorkoutHistoryItem[] = [];

    for (const workout of workouts) {
      // Get exercise count for this workout
      const exerciseCountResult = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM workout_exercises WHERE workout_id = ?`,
        workout.id,
      );

      // Get muscle groups for this workout (from exercises table via workout_exercises)
      const muscleGroupsResult = db.getAllSync<{ primary_muscles: string }>(
        `SELECT DISTINCT e.primary_muscles
         FROM workout_exercises we
         JOIN exercises e ON we.exercise_id = e.id
         WHERE we.workout_id = ?`,
        workout.id,
      );

      // Parse and dedupe muscle groups
      const muscleSet = new Set<string>();
      for (const row of muscleGroupsResult) {
        const muscles = row.primary_muscles.split(",");
        for (const muscle of muscles) {
          muscleSet.add(muscle.trim());
        }
      }

      result.push({
        id: workout.id,
        startTime: new Date(workout.start_time * 1000),
        endTime: new Date(workout.end_time * 1000),
        durationSeconds: workout.duration_seconds,
        totalVolume: workout.total_volume,
        exerciseCount: exerciseCountResult?.count ?? 0,
        muscleGroups: Array.from(muscleSet),
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch workout history:", error);
    return [];
  }
}

/**
 * Fetch a single workout with full details (exercises and sets)
 */
export async function getWorkoutById(workoutId: number): Promise<WorkoutDetailItem | null> {
  if (IS_WEB) {
    return null;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const workout = db.getFirstSync<{
      id: number;
      start_time: number;
      end_time: number;
      duration_seconds: number;
      total_volume: number;
      notes: string | null;
    }>(
      `SELECT id, start_time, end_time, duration_seconds, total_volume, notes FROM workouts WHERE id = ?`,
      workoutId,
    );

    if (!workout) return null;

    // Get exercises for this workout with exercise details
    const exercises = db.getAllSync<{
      we_id: number;
      exercise_id: number;
      order_index: number;
      name: string;
      category: string;
      primary_muscles: string;
    }>(
      `SELECT we.id as we_id, we.exercise_id, we.order_index, e.name, e.category, e.primary_muscles
       FROM workout_exercises we
       JOIN exercises e ON we.exercise_id = e.id
       WHERE we.workout_id = ?
       ORDER BY we.order_index`,
      workoutId,
    );

    const exerciseDetails: WorkoutExerciseDetail[] = [];

    for (const ex of exercises) {
      // Get sets for this exercise
      const sets = db.getAllSync<{
        id: number;
        set_number: number;
        weight: number | null;
        reps: number | null;
        is_warmup: number;
      }>(
        `SELECT id, set_number, weight, reps, is_warmup
         FROM workout_sets
         WHERE workout_exercise_id = ?
         ORDER BY set_number`,
        ex.we_id,
      );

      exerciseDetails.push({
        exerciseId: ex.exercise_id,
        name: ex.name,
        category: ex.category,
        primaryMuscles: ex.primary_muscles.split(",").map((m) => m.trim()),
        sets: sets.map((s) => ({
          id: s.id,
          setNumber: s.set_number,
          weight: s.weight,
          reps: s.reps,
          isWarmup: Boolean(s.is_warmup),
        })),
      });
    }

    return {
      id: workout.id,
      startTime: new Date(workout.start_time * 1000),
      endTime: new Date(workout.end_time * 1000),
      durationSeconds: workout.duration_seconds,
      totalVolume: workout.total_volume,
      notes: workout.notes,
      exercises: exerciseDetails,
    };
  } catch (error) {
    console.error("Failed to fetch workout by id:", error);
    return null;
  }
}

export interface WorkoutSetDetail {
  id: number;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
}

export interface WorkoutExerciseDetail {
  exerciseId: number;
  name: string;
  category: string;
  primaryMuscles: string[];
  sets: WorkoutSetDetail[];
}

export interface WorkoutDetailItem {
  id: number;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  totalVolume: number;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
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

    // Try to sync to HealthKit (non-blocking, fails silently)
    let healthKitSynced = false;
    if (workoutId) {
      const healthKitResult = await saveWorkoutToHealthKit({
        startTime: input.startTime,
        endTime: input.endTime,
      });

      if (healthKitResult.success) {
        healthKitSynced = true;
        // Mark as synced in database
        try {
          const dbForUpdate = SQLite.openDatabaseSync(DATABASE_NAME);
          dbForUpdate.runSync(
            `UPDATE workouts SET synced_to_healthkit = 1 WHERE id = ?`,
            workoutId,
          );
        } catch (e) {
          console.error("Failed to mark workout synced:", e);
        }
      }
    }

    return { success: true, workoutId, healthKitSynced };
  } catch (error) {
    console.error("Failed to save workout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Muscle frequency data for the chart
 */
export interface MuscleFrequencyPoint {
  muscle: MuscleGroup;
  label: string;
  sets: number;
  color: string;
}

export interface MuscleFrequencyData {
  points: MuscleFrequencyPoint[];
  totalSets: number;
  hasData: boolean;
}

// Colors for each muscle group
const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: "#ef4444", // red
  back: "#3b82f6", // blue
  shoulders: "#f97316", // orange
  biceps: "#8b5cf6", // purple
  triceps: "#ec4899", // pink
  quads: "#22c55e", // green
  hamstrings: "#14b8a6", // teal
  glutes: "#f59e0b", // amber
  calves: "#6366f1", // indigo
  abs: "#06b6d4", // cyan
};

// Short labels for chart display
const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shldrs",
  biceps: "Biceps",
  triceps: "Tricps",
  quads: "Quads",
  hamstrings: "Hams",
  glutes: "Glutes",
  calves: "Calves",
  abs: "Abs",
};

/**
 * Workout record for HealthKit sync retry
 */
export interface UnsyncedWorkout {
  id: number;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
}

/**
 * Get workouts that haven't been synced to HealthKit yet
 */
export async function getUnsyncedWorkouts(): Promise<UnsyncedWorkout[]> {
  if (IS_WEB) {
    return [];
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const workouts = db.getAllSync<{
      id: number;
      start_time: number;
      end_time: number;
      duration_seconds: number;
    }>(
      `SELECT id, start_time, end_time, duration_seconds
       FROM workouts
       WHERE synced_to_healthkit = 0
       ORDER BY start_time ASC`,
    );

    return workouts.map((w) => ({
      id: w.id,
      startTime: new Date(w.start_time * 1000),
      endTime: new Date(w.end_time * 1000),
      durationSeconds: w.duration_seconds,
    }));
  } catch (error) {
    console.error("Failed to fetch unsynced workouts:", error);
    return [];
  }
}

/**
 * Mark a workout as synced to HealthKit
 */
export async function markWorkoutSynced(workoutId: number): Promise<boolean> {
  if (IS_WEB) {
    return false;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    db.runSync(`UPDATE workouts SET synced_to_healthkit = 1 WHERE id = ?`, workoutId);
    return true;
  } catch (error) {
    console.error("Failed to mark workout synced:", error);
    return false;
  }
}

/**
 * Retry syncing unsynced workouts to HealthKit
 * Called on app launch to retry failed writes
 */
export async function retrySyncUnsyncedWorkouts(): Promise<{ synced: number; failed: number }> {
  const unsyncedWorkouts = await getUnsyncedWorkouts();
  let synced = 0;
  let failed = 0;

  for (const workout of unsyncedWorkouts) {
    const result = await saveWorkoutToHealthKit({
      startTime: workout.startTime,
      endTime: workout.endTime,
    });

    if (result.success) {
      await markWorkoutSynced(workout.id);
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Get muscle frequency data aggregated from last 4 weeks
 * Counts sets per muscle group (primary muscles only, excludes warmup sets)
 */
export async function getMuscleFrequencyData(): Promise<MuscleFrequencyData> {
  if (IS_WEB) {
    return { points: [], totalSets: 0, hasData: false };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Calculate 4 weeks ago timestamp
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoTimestamp = Math.floor(fourWeeksAgo.getTime() / 1000);

    // Query to get set counts per exercise, joined with exercise data
    // Only count non-warmup sets from workouts in the last 4 weeks
    const results = db.getAllSync<{
      primary_muscles: string;
      set_count: number;
    }>(
      `SELECT e.primary_muscles, COUNT(ws.id) as set_count
       FROM workout_sets ws
       JOIN workout_exercises we ON ws.workout_exercise_id = we.id
       JOIN workouts w ON we.workout_id = w.id
       JOIN exercises e ON we.exercise_id = e.id
       WHERE w.start_time >= ? AND ws.is_warmup = 0
       GROUP BY we.exercise_id`,
      fourWeeksAgoTimestamp,
    );

    // Aggregate sets by muscle group
    const muscleSetCounts: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      quads: 0,
      hamstrings: 0,
      glutes: 0,
      calves: 0,
      abs: 0,
    };

    for (const row of results) {
      const muscles = row.primary_muscles.split(",").map((m) => m.trim()) as MuscleGroup[];
      for (const muscle of muscles) {
        if (muscleSetCounts[muscle] !== undefined) {
          muscleSetCounts[muscle] += row.set_count;
        }
      }
    }

    // Build points array
    const points: MuscleFrequencyPoint[] = ALL_MUSCLE_GROUPS.map((muscle) => ({
      muscle,
      label: MUSCLE_LABELS[muscle],
      sets: muscleSetCounts[muscle],
      color: MUSCLE_COLORS[muscle],
    }));

    const totalSets = points.reduce((sum, p) => sum + p.sets, 0);

    return {
      points,
      totalSets,
      hasData: totalSets > 0,
    };
  } catch (error) {
    console.error("Failed to fetch muscle frequency data:", error);
    return { points: [], totalSets: 0, hasData: false };
  }
}
