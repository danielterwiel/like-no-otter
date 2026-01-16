import { Platform } from "react-native";
import {
  fetchSleepDataForDate,
  fetchStepsDataForDate,
  fetchCaloriesDataForDate,
  fetchHeartRateDataForDate,
} from "./queries";

const DATABASE_NAME = "likenootter.db";
const SYNC_DAYS = 30;

export interface SyncResult {
  success: boolean;
  syncedAt: Date;
  recordsInserted: number;
}

type HealthMetricType = "sleep" | "steps" | "calories" | "rhr";

interface HealthMetricRecord {
  type: HealthMetricType;
  value: number;
  unit: string;
  date: string;
  startTime: number | null;
  endTime: number | null;
  syncedAt: number;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function fetchAllMetricsForDate(date: Date): Promise<HealthMetricRecord[]> {
  const records: HealthMetricRecord[] = [];
  const dateKey = formatDateKey(date);
  const syncedAt = Date.now();

  try {
    const [sleep, steps, calories, heartRate] = await Promise.all([
      fetchSleepDataForDate(date).catch(() => null),
      fetchStepsDataForDate(date).catch(() => null),
      fetchCaloriesDataForDate(date).catch(() => null),
      fetchHeartRateDataForDate(date).catch(() => null),
    ]);

    if (sleep && sleep.totalHours > 0) {
      records.push({
        type: "sleep",
        value: sleep.totalHours,
        unit: "hours",
        date: dateKey,
        startTime: sleep.startTime ? sleep.startTime.getTime() : null,
        endTime: sleep.endTime ? sleep.endTime.getTime() : null,
        syncedAt,
      });
    }

    if (steps && steps.count > 0) {
      records.push({
        type: "steps",
        value: steps.count,
        unit: "count",
        date: dateKey,
        startTime: null,
        endTime: null,
        syncedAt,
      });
    }

    if (calories && calories.activeCalories > 0) {
      records.push({
        type: "calories",
        value: calories.activeCalories,
        unit: "kcal",
        date: dateKey,
        startTime: null,
        endTime: null,
        syncedAt,
      });
    }

    if (heartRate && heartRate.restingHeartRate > 0) {
      records.push({
        type: "rhr",
        value: heartRate.restingHeartRate,
        unit: "bpm",
        date: dateKey,
        startTime: null,
        endTime: null,
        syncedAt,
      });
    }
  } catch (error) {
    console.error(`Failed to fetch metrics for ${dateKey}:`, error);
  }

  return records;
}

export async function syncHealthData(): Promise<SyncResult> {
  const syncedAt = new Date();

  // Skip sync on non-iOS platforms
  if (Platform.OS !== "ios") {
    return {
      success: true,
      syncedAt,
      recordsInserted: 0,
    };
  }

  try {
    // Dynamically import expo-sqlite to avoid loading native module on web
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Generate dates for last 30 days
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalize to noon to avoid timezone issues

    for (let i = 0; i < SYNC_DAYS; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }

    // Fetch all metrics for all dates
    const allRecords: HealthMetricRecord[] = [];
    for (const date of dates) {
      const records = await fetchAllMetricsForDate(date);
      allRecords.push(...records);
    }

    // Insert records into database within a transaction
    let recordsInserted = 0;

    db.withTransactionSync(() => {
      // Delete existing records for the date range to avoid duplicates
      const oldestDate = formatDateKey(dates[dates.length - 1]);
      const newestDate = formatDateKey(dates[0]);

      db.runSync(`DELETE FROM health_metrics WHERE date >= ? AND date <= ?`, [
        oldestDate,
        newestDate,
      ]);

      // Insert new records
      for (const record of allRecords) {
        db.runSync(
          `INSERT INTO health_metrics (type, value, unit, date, start_time, end_time, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            record.type,
            record.value,
            record.unit,
            record.date,
            record.startTime,
            record.endTime,
            record.syncedAt,
          ],
        );
        recordsInserted++;
      }
    });

    return {
      success: true,
      syncedAt,
      recordsInserted,
    };
  } catch (error) {
    console.error("Failed to sync health data:", error);
    return {
      success: false,
      syncedAt,
      recordsInserted: 0,
    };
  }
}
