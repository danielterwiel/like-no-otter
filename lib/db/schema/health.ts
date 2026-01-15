import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const healthMetrics = sqliteTable("health_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'sleep', 'steps', 'calories', 'rhr'
  value: real("value").notNull(),
  unit: text("unit").notNull(), // 'hours', 'count', 'kcal', 'bpm'
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  startTime: integer("start_time", { mode: "timestamp" }),
  endTime: integer("end_time", { mode: "timestamp" }),
  syncedAt: integer("synced_at", { mode: "timestamp" }).notNull(),
});
