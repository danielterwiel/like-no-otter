import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  dueDate: text("due_date"), // ISO date string YYYY-MM-DD or null
  priority: text("priority").notNull().default("none"), // 'none', 'low', 'medium', 'high'
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  // TickTick sync fields
  ticktickId: text("ticktick_id"), // TickTick task ID for synced tasks
  ticktickProjectId: text("ticktick_project_id"), // TickTick project ID
  ticktickEtag: text("ticktick_etag"), // ETag for change detection
  modifiedAt: integer("modified_at", { mode: "timestamp" }), // Last modification timestamp for conflict resolution
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false), // Soft delete flag
});
