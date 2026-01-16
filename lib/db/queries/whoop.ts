import { Platform } from "react-native";
import { eq } from "drizzle-orm";
import type { NewWhoopRecovery, NewWhoopSleep, NewWhoopCycle } from "../schema/whoop";

const IS_NATIVE = Platform.OS === "ios" || Platform.OS === "android";

export interface WhoopRecoveryData {
  whoopId: string;
  date: string;
  recoveryScore: number | null;
  hrvRmssd: number | null;
  restingHeartRate: number | null;
  spo2: number | null;
  skinTemp: number | null;
}

export interface WhoopSleepData {
  whoopId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  qualityDuration: number | null;
  remDuration: number | null;
  deepDuration: number | null;
  lightDuration: number | null;
  awakeDuration: number | null;
  respiratoryRate: number | null;
}

export interface WhoopCycleData {
  whoopId: string;
  date: string;
  strain: number | null;
  kilojoules: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

export async function saveWhoopRecoveryRecords(records: WhoopRecoveryData[]): Promise<number> {
  if (!IS_NATIVE || records.length === 0) {
    return 0;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopRecovery } = await import("../schema/whoop");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const syncedAt = new Date();
  let savedCount = 0;

  for (const record of records) {
    try {
      // Use INSERT OR REPLACE to handle updates
      await db
        .insert(whoopRecovery)
        .values({
          whoopId: record.whoopId,
          date: record.date,
          recoveryScore: record.recoveryScore,
          hrvRmssd: record.hrvRmssd,
          restingHeartRate: record.restingHeartRate,
          spo2: record.spo2,
          skinTemp: record.skinTemp,
          syncedAt,
        } satisfies NewWhoopRecovery)
        .onConflictDoUpdate({
          target: whoopRecovery.whoopId,
          set: {
            date: record.date,
            recoveryScore: record.recoveryScore,
            hrvRmssd: record.hrvRmssd,
            restingHeartRate: record.restingHeartRate,
            spo2: record.spo2,
            skinTemp: record.skinTemp,
            syncedAt,
          },
        });
      savedCount++;
    } catch (error) {
      console.error("Failed to save recovery record:", error);
    }
  }

  return savedCount;
}

export async function saveWhoopSleepRecords(records: WhoopSleepData[]): Promise<number> {
  if (!IS_NATIVE || records.length === 0) {
    return 0;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopSleep } = await import("../schema/whoop");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const syncedAt = new Date();
  let savedCount = 0;

  for (const record of records) {
    try {
      await db
        .insert(whoopSleep)
        .values({
          whoopId: record.whoopId,
          date: record.date,
          startTime: record.startTime,
          endTime: record.endTime,
          qualityDuration: record.qualityDuration,
          remDuration: record.remDuration,
          deepDuration: record.deepDuration,
          lightDuration: record.lightDuration,
          awakeDuration: record.awakeDuration,
          respiratoryRate: record.respiratoryRate,
          syncedAt,
        } satisfies NewWhoopSleep)
        .onConflictDoUpdate({
          target: whoopSleep.whoopId,
          set: {
            date: record.date,
            startTime: record.startTime,
            endTime: record.endTime,
            qualityDuration: record.qualityDuration,
            remDuration: record.remDuration,
            deepDuration: record.deepDuration,
            lightDuration: record.lightDuration,
            awakeDuration: record.awakeDuration,
            respiratoryRate: record.respiratoryRate,
            syncedAt,
          },
        });
      savedCount++;
    } catch (error) {
      console.error("Failed to save sleep record:", error);
    }
  }

  return savedCount;
}

export async function saveWhoopCycleRecords(records: WhoopCycleData[]): Promise<number> {
  if (!IS_NATIVE || records.length === 0) {
    return 0;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopCycles } = await import("../schema/whoop");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const syncedAt = new Date();
  let savedCount = 0;

  for (const record of records) {
    try {
      await db
        .insert(whoopCycles)
        .values({
          whoopId: record.whoopId,
          date: record.date,
          strain: record.strain,
          kilojoules: record.kilojoules,
          avgHeartRate: record.avgHeartRate,
          maxHeartRate: record.maxHeartRate,
          syncedAt,
        } satisfies NewWhoopCycle)
        .onConflictDoUpdate({
          target: whoopCycles.whoopId,
          set: {
            date: record.date,
            strain: record.strain,
            kilojoules: record.kilojoules,
            avgHeartRate: record.avgHeartRate,
            maxHeartRate: record.maxHeartRate,
            syncedAt,
          },
        });
      savedCount++;
    } catch (error) {
      console.error("Failed to save cycle record:", error);
    }
  }

  return savedCount;
}

export async function getLatestWhoopRecovery(): Promise<WhoopRecoveryData | null> {
  if (!IS_NATIVE) {
    return null;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopRecovery } = await import("../schema/whoop");
  const { desc } = await import("drizzle-orm");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const results = await db.select().from(whoopRecovery).orderBy(desc(whoopRecovery.date)).limit(1);

  if (results.length === 0) {
    return null;
  }

  const record = results[0];
  return {
    whoopId: record.whoopId,
    date: record.date,
    recoveryScore: record.recoveryScore,
    hrvRmssd: record.hrvRmssd,
    restingHeartRate: record.restingHeartRate,
    spo2: record.spo2,
    skinTemp: record.skinTemp,
  };
}

export async function getWhoopRecoveryByDate(date: string): Promise<WhoopRecoveryData | null> {
  if (!IS_NATIVE) {
    return null;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopRecovery } = await import("../schema/whoop");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const results = await db
    .select()
    .from(whoopRecovery)
    .where(eq(whoopRecovery.date, date))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const record = results[0];
  return {
    whoopId: record.whoopId,
    date: record.date,
    recoveryScore: record.recoveryScore,
    hrvRmssd: record.hrvRmssd,
    restingHeartRate: record.restingHeartRate,
    spo2: record.spo2,
    skinTemp: record.skinTemp,
  };
}

export async function getLatestWhoopCycle(): Promise<WhoopCycleData | null> {
  if (!IS_NATIVE) {
    return null;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopCycles } = await import("../schema/whoop");
  const { desc } = await import("drizzle-orm");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const results = await db.select().from(whoopCycles).orderBy(desc(whoopCycles.date)).limit(1);

  if (results.length === 0) {
    return null;
  }

  const record = results[0];
  return {
    whoopId: record.whoopId,
    date: record.date,
    strain: record.strain,
    kilojoules: record.kilojoules,
    avgHeartRate: record.avgHeartRate,
    maxHeartRate: record.maxHeartRate,
  };
}

export async function getLatestWhoopSleep(): Promise<WhoopSleepData | null> {
  if (!IS_NATIVE) {
    return null;
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopSleep } = await import("../schema/whoop");
  const { desc } = await import("drizzle-orm");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  const results = await db.select().from(whoopSleep).orderBy(desc(whoopSleep.date)).limit(1);

  if (results.length === 0) {
    return null;
  }

  const record = results[0];
  return {
    whoopId: record.whoopId,
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    qualityDuration: record.qualityDuration,
    remDuration: record.remDuration,
    deepDuration: record.deepDuration,
    lightDuration: record.lightDuration,
    awakeDuration: record.awakeDuration,
    respiratoryRate: record.respiratoryRate,
  };
}

export interface RecoveryTrendPoint {
  date: string;
  value: number;
  dayLabel: string;
}

export interface RecoveryTrendData {
  points: RecoveryTrendPoint[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getRecoveryTrendData(days: number = 7): Promise<RecoveryTrendData> {
  if (!IS_NATIVE) {
    return { points: [] };
  }

  const { drizzle } = await import("drizzle-orm/expo-sqlite");
  const SQLite = await import("expo-sqlite");
  const { whoopRecovery } = await import("../schema/whoop");
  const { desc, gte } = await import("drizzle-orm");

  const expo = SQLite.openDatabaseSync("likenootter.db");
  const db = drizzle(expo);

  // Calculate date for N days ago
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  const results = await db
    .select()
    .from(whoopRecovery)
    .where(gte(whoopRecovery.date, startDateStr))
    .orderBy(desc(whoopRecovery.date))
    .limit(days);

  const points: RecoveryTrendPoint[] = results
    .filter((r) => r.recoveryScore !== null)
    .map((record) => {
      const date = new Date(record.date);
      return {
        date: record.date,
        value: record.recoveryScore!,
        dayLabel: DAY_LABELS[date.getDay()],
      };
    })
    .reverse(); // Oldest first for chart

  return { points };
}
