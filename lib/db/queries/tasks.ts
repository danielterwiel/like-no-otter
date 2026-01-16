import { Platform } from "react-native";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

export type TaskPriority = "none" | "low" | "medium" | "high";

export interface TaskRecord {
  id: number;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

export interface CreateTaskInput {
  title: string;
  dueDate?: string | null; // ISO date string YYYY-MM-DD
  priority?: TaskPriority;
}

export interface CreateTaskResult {
  success: boolean;
  taskId?: number;
  error?: string;
}

interface TaskRow {
  id: number;
  title: string;
  due_date: string | null;
  priority: string;
  is_completed: number;
  completed_at: number | null;
  created_at: number;
}

function parseTaskRow(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    priority: row.priority as TaskPriority,
    isCompleted: row.is_completed === 1,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  if (IS_WEB) {
    return { success: false, error: "Tasks not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const result = db.runSync(
      `INSERT INTO tasks (title, due_date, priority, is_completed, created_at)
       VALUES (?, ?, ?, 0, ?)`,
      input.title,
      input.dueDate || null,
      input.priority || "none",
      Date.now(),
    );

    return {
      success: true,
      taskId: result.lastInsertRowId,
    };
  } catch (error) {
    console.error("Failed to create task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all tasks ordered by due date and creation date
 */
export async function getAllTasks(): Promise<TaskRecord[]> {
  if (IS_WEB) {
    return [];
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const rows = db.getAllSync<TaskRow>(
      `SELECT * FROM tasks
       ORDER BY
         CASE WHEN is_completed = 1 THEN 1 ELSE 0 END,
         CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
         due_date,
         created_at DESC`,
    );

    return rows.map(parseTaskRow);
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return [];
  }
}

/**
 * Get task count
 */
export async function getTaskCount(): Promise<number> {
  if (IS_WEB) {
    return 0;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const result = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM tasks");
    return result?.count ?? 0;
  } catch (error) {
    console.error("Failed to get task count:", error);
    return 0;
  }
}

/**
 * Get incomplete task count
 */
export async function getIncompleteTaskCount(): Promise<number> {
  if (IS_WEB) {
    return 0;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE is_completed = 0",
    );
    return result?.count ?? 0;
  } catch (error) {
    console.error("Failed to get incomplete task count:", error);
    return 0;
  }
}
