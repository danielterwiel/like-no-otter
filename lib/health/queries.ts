import { Platform } from "react-native";

export interface SleepData {
  totalHours: number;
  startTime: Date | null;
  endTime: Date | null;
}

export interface StepsData {
  count: number;
}

export interface CaloriesData {
  activeCalories: number;
}

export interface HeartRateData {
  restingHeartRate: number;
}

export interface HealthData {
  sleep: SleepData | null;
  steps: StepsData | null;
  calories: CaloriesData | null;
  heartRate: HeartRateData | null;
}

// Get start of today in ISO format
function getStartOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// Get end of today in ISO format
function getEndOfToday(): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AppleHealthKit: any = null;

async function getHealthKit() {
  if (Platform.OS !== "ios") {
    return null;
  }
  if (!AppleHealthKit) {
    const module = await import("react-native-health");
    AppleHealthKit = module.default;
  }
  return AppleHealthKit;
}

export async function fetchSleepData(): Promise<SleepData | null> {
  if (Platform.OS !== "ios") {
    return null;
  }

  try {
    const healthKit = await getHealthKit();
    if (!healthKit) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(18, 0, 0, 0); // Start from 6 PM yesterday

    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      healthKit.getSleepSamples(options, (err: Error | null, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(null);
          return;
        }

        // Sum up sleep duration from all sleep samples
        let totalMinutes = 0;
        let earliestStart: Date | null = null;
        let latestEnd: Date | null = null;

        for (const sample of results) {
          // Only count actual sleep (not "in bed")
          if (sample.value === "ASLEEP" || sample.value === "INBED") {
            const start = new Date(sample.startDate);
            const end = new Date(sample.endDate);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60);
            totalMinutes += duration;

            if (!earliestStart || start < earliestStart) {
              earliestStart = start;
            }
            if (!latestEnd || end > latestEnd) {
              latestEnd = end;
            }
          }
        }

        resolve({
          totalHours: totalMinutes / 60,
          startTime: earliestStart,
          endTime: latestEnd,
        });
      });
    });
  } catch {
    return null;
  }
}

export async function fetchStepsData(): Promise<StepsData | null> {
  if (Platform.OS !== "ios") {
    return null;
  }

  try {
    const healthKit = await getHealthKit();
    if (!healthKit) return null;

    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };

    return new Promise((resolve) => {
      healthKit.getStepCount(options, (err: Error | null, results: { value: number }) => {
        if (err || !results) {
          resolve(null);
          return;
        }
        resolve({ count: Math.round(results.value) });
      });
    });
  } catch {
    return null;
  }
}

export async function fetchCaloriesData(): Promise<CaloriesData | null> {
  if (Platform.OS !== "ios") {
    return null;
  }

  try {
    const healthKit = await getHealthKit();
    if (!healthKit) return null;

    const options = {
      startDate: getStartOfToday().toISOString(),
      endDate: getEndOfToday().toISOString(),
    };

    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      healthKit.getActiveEnergyBurned(options, (err: Error | null, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(null);
          return;
        }

        // Sum all active energy samples for today
        const totalCalories = results.reduce((sum, sample) => sum + (sample.value || 0), 0);
        resolve({ activeCalories: Math.round(totalCalories) });
      });
    });
  } catch {
    return null;
  }
}

export async function fetchHeartRateData(): Promise<HeartRateData | null> {
  if (Platform.OS !== "ios") {
    return null;
  }

  try {
    const healthKit = await getHealthKit();
    if (!healthKit) return null;

    const options = {
      startDate: getStartOfToday().toISOString(),
      endDate: getEndOfToday().toISOString(),
    };

    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      healthKit.getRestingHeartRate(options, (err: Error | null, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(null);
          return;
        }

        // Get most recent resting heart rate
        const mostRecent = results[results.length - 1];
        resolve({ restingHeartRate: Math.round(mostRecent.value) });
      });
    });
  } catch {
    return null;
  }
}

export async function fetchTodayHealthData(): Promise<HealthData> {
  const [sleep, steps, calories, heartRate] = await Promise.all([
    fetchSleepData(),
    fetchStepsData(),
    fetchCaloriesData(),
    fetchHeartRateData(),
  ]);

  return { sleep, steps, calories, heartRate };
}
