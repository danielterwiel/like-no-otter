import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Whoop recovery data - links to sleep cycles
export const whoopRecovery = sqliteTable("whoop_recovery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  whoopId: text("whoop_id").notNull().unique(), // Whoop's cycle ID
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  recoveryScore: integer("recovery_score"), // 0-100%
  hrvRmssd: real("hrv_rmssd"), // HRV in milliseconds
  restingHeartRate: integer("resting_heart_rate"), // BPM
  spo2: real("spo2"), // Blood oxygen percentage
  skinTemp: real("skin_temp"), // Celsius
  syncedAt: integer("synced_at", { mode: "timestamp" }).notNull(),
});

// Whoop sleep data
export const whoopSleep = sqliteTable("whoop_sleep", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  whoopId: text("whoop_id").notNull().unique(), // Whoop's sleep activity ID
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  qualityDuration: integer("quality_duration"), // Total quality sleep in seconds
  remDuration: integer("rem_duration"), // REM sleep in seconds
  deepDuration: integer("deep_duration"), // Deep/SWS sleep in seconds
  lightDuration: integer("light_duration"), // Light sleep in seconds
  awakeDuration: integer("awake_duration"), // Awake time in seconds
  respiratoryRate: real("respiratory_rate"), // Breaths per minute
  syncedAt: integer("synced_at", { mode: "timestamp" }).notNull(),
});

// Whoop physiological cycles (strain/activity)
export const whoopCycles = sqliteTable("whoop_cycles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  whoopId: text("whoop_id").notNull().unique(), // Whoop's cycle ID
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  strain: real("strain"), // 0-21 scale
  kilojoules: real("kilojoules"), // Energy expenditure
  avgHeartRate: integer("avg_heart_rate"), // BPM
  maxHeartRate: integer("max_heart_rate"), // BPM
  syncedAt: integer("synced_at", { mode: "timestamp" }).notNull(),
});

// Type exports for use in queries
export type WhoopRecovery = typeof whoopRecovery.$inferSelect;
export type NewWhoopRecovery = typeof whoopRecovery.$inferInsert;
export type WhoopSleep = typeof whoopSleep.$inferSelect;
export type NewWhoopSleep = typeof whoopSleep.$inferInsert;
export type WhoopCycle = typeof whoopCycles.$inferSelect;
export type NewWhoopCycle = typeof whoopCycles.$inferInsert;
