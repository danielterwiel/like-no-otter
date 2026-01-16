import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export type ServiceType = "whoop" | "ticktick" | "strong";
export type ConnectionStatus = "connected" | "disconnected" | "error";

export const connections = sqliteTable("connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  service: text("service").$type<ServiceType>().notNull(),
  status: text("status").$type<ConnectionStatus>().notNull().default("disconnected"),
  connectedAt: integer("connected_at"),
  lastSyncAt: integer("last_sync_at"),
  syncError: text("sync_error"),
  metadata: text("metadata"),
});

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
