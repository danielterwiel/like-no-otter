import { Platform } from "react-native";
import { EXERCISES } from "@/constants/exercises";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

/**
 * Seeds the exercises table with predefined exercises if empty.
 * Should be called after migrations complete.
 */
export async function seedExercises(): Promise<void> {
  // Skip seeding on web - expo-sqlite doesn't support web
  if (IS_WEB) {
    return;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Check if exercises already exist
    const result = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM exercises");

    if (result && result.count > 0) {
      // Already seeded, skip
      return;
    }

    // Insert all exercises in a transaction
    db.withTransactionSync(() => {
      for (const exercise of EXERCISES) {
        db.runSync(
          `INSERT INTO exercises (name, category, primary_muscles, secondary_muscles, is_custom)
           VALUES (?, ?, ?, ?, ?)`,
          exercise.name,
          exercise.category,
          exercise.primaryMuscles.join(","),
          exercise.secondaryMuscles.join(","),
          0, // isCustom = false for seeded exercises
        );
      }
    });

    console.log(`Seeded ${EXERCISES.length} exercises`);
  } catch (error) {
    console.error("Failed to seed exercises:", error);
    // Don't throw - seeding failure shouldn't crash the app
  }
}
