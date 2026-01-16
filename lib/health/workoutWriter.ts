import { Platform } from "react-native";
import type { HealthActivity, HealthValue } from "react-native-health";

export interface SaveWorkoutToHealthKitInput {
  startTime: Date;
  endTime: Date;
  totalCalories?: number; // Estimated calories burned
}

export interface SaveWorkoutToHealthKitResult {
  success: boolean;
  error?: string;
}

/**
 * Estimate calories burned during strength training workout
 * Uses a simple formula: ~5 calories per minute of strength training
 * This is a conservative estimate for moderate intensity
 */
export function estimateCaloriesBurned(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return Math.round(durationMinutes * 5);
}

/**
 * Save a completed workout to Apple HealthKit
 * Fails silently - returns success: false without throwing
 */
export async function saveWorkoutToHealthKit(
  input: SaveWorkoutToHealthKitInput,
): Promise<SaveWorkoutToHealthKitResult> {
  // Only available on iOS
  if (Platform.OS !== "ios") {
    return { success: false, error: "HealthKit only available on iOS" };
  }

  try {
    // Dynamically import react-native-health
    const healthModule = await import("react-native-health");
    const AppleHealthKit = healthModule.default;
    const { HealthActivity: HealthActivityEnum } = healthModule;

    // Check if HealthKit is available
    const isAvailable = await new Promise<boolean>((resolve) => {
      AppleHealthKit.isAvailable((error: object, available: boolean) => {
        resolve(!error && !!available);
      });
    });

    if (!isAvailable) {
      return { success: false, error: "HealthKit not available" };
    }

    // Save the workout
    return new Promise<SaveWorkoutToHealthKitResult>((resolve) => {
      AppleHealthKit.saveWorkout(
        {
          type: HealthActivityEnum.TraditionalStrengthTraining as HealthActivity,
          startDate: input.startTime.toISOString(),
          endDate: input.endTime.toISOString(),
          // Note: The library doesn't support passing energyBurned directly
          // in saveWorkout options, so we just save the workout record
        },
        (error: string, _result: HealthValue) => {
          if (error) {
            console.log("Failed to save workout to HealthKit:", error);
            resolve({ success: false, error });
          } else {
            resolve({ success: true });
          }
        },
      );
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log("Error saving workout to HealthKit:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
