import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  totalVolume: real("total_volume").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  syncedToHealthKit: integer("synced_to_healthkit", { mode: "boolean" }).default(false),
});

export const workoutExercises = sqliteTable("workout_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutExerciseId: integer("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  isWarmup: integer("is_warmup", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  primaryMuscles: text("primary_muscles").notNull(),
  secondaryMuscles: text("secondary_muscles"),
  isCustom: integer("is_custom", { mode: "boolean" }).default(false),
});
