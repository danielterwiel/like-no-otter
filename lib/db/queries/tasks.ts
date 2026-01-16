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

export type TaskSection = "today" | "upcoming" | "done";

export interface TasksBySection {
  today: TaskRecord[];
  upcoming: TaskRecord[];
  done: TaskRecord[];
}

/**
 * Get tasks grouped by section (Today, Upcoming, Done)
 * - Today: tasks due today or overdue (incomplete only)
 * - Upcoming: tasks due in the future or no due date (incomplete only)
 * - Done: completed tasks
 */
export async function getTasksBySection(): Promise<TasksBySection> {
  if (IS_WEB) {
    return { today: [], upcoming: [], done: [] };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Get all tasks
    const rows = db.getAllSync<TaskRow>(
      `SELECT * FROM tasks ORDER BY
         CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
         due_date,
         created_at DESC`,
    );

    const tasks = rows.map(parseTaskRow);

    const result: TasksBySection = {
      today: [],
      upcoming: [],
      done: [],
    };

    for (const task of tasks) {
      if (task.isCompleted) {
        result.done.push(task);
      } else if (task.dueDate && task.dueDate <= todayStr) {
        // Due today or overdue
        result.today.push(task);
      } else {
        // Due in future or no due date
        result.upcoming.push(task);
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to get tasks by section:", error);
    return { today: [], upcoming: [], done: [] };
  }
}
