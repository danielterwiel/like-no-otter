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
  ticktickId: string | null;
  ticktickProjectId: string | null;
  ticktickEtag: string | null;
  modifiedAt: Date | null;
  isDeleted: boolean;
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
  ticktick_id: string | null;
  ticktick_project_id: string | null;
  ticktick_etag: string | null;
  modified_at: number | null;
  is_deleted: number | null;
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
    ticktickId: row.ticktick_id,
    ticktickProjectId: row.ticktick_project_id,
    ticktickEtag: row.ticktick_etag,
    modifiedAt: row.modified_at ? new Date(row.modified_at) : null,
    isDeleted: row.is_deleted === 1,
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

    const now = Date.now();
    const result = db.runSync(
      `INSERT INTO tasks (title, due_date, priority, is_completed, created_at, modified_at)
       VALUES (?, ?, ?, 0, ?, ?)`,
      input.title,
      input.dueDate || null,
      input.priority || "none",
      now,
      now,
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
 * Excludes soft-deleted tasks
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
       WHERE is_deleted = 0 OR is_deleted IS NULL
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
 * Get task count (excludes soft-deleted tasks)
 */
export async function getTaskCount(): Promise<number> {
  if (IS_WEB) {
    return 0;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 OR is_deleted IS NULL",
    );
    return result?.count ?? 0;
  } catch (error) {
    console.error("Failed to get task count:", error);
    return 0;
  }
}

/**
 * Get incomplete task count (excludes soft-deleted tasks)
 */
export async function getIncompleteTaskCount(): Promise<number> {
  if (IS_WEB) {
    return 0;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE is_completed = 0 AND (is_deleted = 0 OR is_deleted IS NULL)",
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
 * Excludes soft-deleted tasks
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

    // Get all non-deleted tasks
    const rows = db.getAllSync<TaskRow>(
      `SELECT * FROM tasks
       WHERE is_deleted = 0 OR is_deleted IS NULL
       ORDER BY
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

export interface ToggleTaskResult {
  success: boolean;
  isCompleted?: boolean;
  error?: string;
}

/**
 * Toggle task completion status
 * If task is incomplete, mark it complete with timestamp
 * If task is complete, mark it incomplete and clear timestamp
 * Updates modified_at for sync tracking
 */
export async function toggleTaskCompletion(taskId: number): Promise<ToggleTaskResult> {
  if (IS_WEB) {
    return { success: false, error: "Tasks not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Get current status
    const task = db.getFirstSync<TaskRow>(`SELECT * FROM tasks WHERE id = ?`, taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const newIsCompleted = task.is_completed === 0;
    const now = Date.now();
    const completedAt = newIsCompleted ? now : null;

    db.runSync(
      `UPDATE tasks SET is_completed = ?, completed_at = ?, modified_at = ? WHERE id = ?`,
      newIsCompleted ? 1 : 0,
      completedAt,
      now,
      taskId,
    );

    return {
      success: true,
      isCompleted: newIsCompleted,
    };
  } catch (error) {
    console.error("Failed to toggle task completion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// TickTick sync-related functions

/**
 * Get a task by its TickTick ID
 */
export async function getTaskByTickTickId(ticktickId: string): Promise<TaskRecord | null> {
  if (IS_WEB) {
    return null;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const row = db.getFirstSync<TaskRow>(`SELECT * FROM tasks WHERE ticktick_id = ?`, ticktickId);

    return row ? parseTaskRow(row) : null;
  } catch (error) {
    console.error("Failed to get task by TickTick ID:", error);
    return null;
  }
}

/**
 * Get all tasks that have a TickTick ID (synced tasks)
 */
export async function getTickTickSyncedTasks(): Promise<TaskRecord[]> {
  if (IS_WEB) {
    return [];
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const rows = db.getAllSync<TaskRow>(`SELECT * FROM tasks WHERE ticktick_id IS NOT NULL`);

    return rows.map(parseTaskRow);
  } catch (error) {
    console.error("Failed to get TickTick synced tasks:", error);
    return [];
  }
}

/**
 * Get tasks that have been modified locally and need to be synced to TickTick
 * Returns tasks with ticktick_id that have been modified after their last etag update
 */
export async function getTasksNeedingSync(): Promise<TaskRecord[]> {
  if (IS_WEB) {
    return [];
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    // Tasks with ticktick_id that may need sync (have modified_at)
    // We'll compare with remote data to determine actual changes
    const rows = db.getAllSync<TaskRow>(
      `SELECT * FROM tasks
       WHERE ticktick_id IS NOT NULL
       AND modified_at IS NOT NULL
       AND (is_deleted = 0 OR is_deleted IS NULL)`,
    );

    return rows.map(parseTaskRow);
  } catch (error) {
    console.error("Failed to get tasks needing sync:", error);
    return [];
  }
}

/**
 * Get local-only tasks (no ticktick_id) that should be pushed to TickTick
 */
export async function getLocalOnlyTasks(): Promise<TaskRecord[]> {
  if (IS_WEB) {
    return [];
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const rows = db.getAllSync<TaskRow>(
      `SELECT * FROM tasks
       WHERE ticktick_id IS NULL
       AND (is_deleted = 0 OR is_deleted IS NULL)`,
    );

    return rows.map(parseTaskRow);
  } catch (error) {
    console.error("Failed to get local-only tasks:", error);
    return [];
  }
}

export interface CreateSyncedTaskInput {
  title: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  isCompleted?: boolean;
  completedAt?: Date | null;
  ticktickId: string;
  ticktickProjectId: string;
  ticktickEtag?: string | null;
  modifiedAt?: Date | null;
}

/**
 * Create a task from TickTick sync (with TickTick fields set)
 */
export async function createSyncedTask(input: CreateSyncedTaskInput): Promise<CreateTaskResult> {
  if (IS_WEB) {
    return { success: false, error: "Tasks not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const now = Date.now();
    const result = db.runSync(
      `INSERT INTO tasks (
        title, due_date, priority, is_completed, completed_at, created_at, modified_at,
        ticktick_id, ticktick_project_id, ticktick_etag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.title,
      input.dueDate || null,
      input.priority || "none",
      input.isCompleted ? 1 : 0,
      input.completedAt?.getTime() || null,
      now,
      input.modifiedAt?.getTime() || now,
      input.ticktickId,
      input.ticktickProjectId,
      input.ticktickEtag || null,
    );

    return {
      success: true,
      taskId: result.lastInsertRowId,
    };
  } catch (error) {
    console.error("Failed to create synced task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface UpdateTaskInput {
  title?: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  isCompleted?: boolean;
  completedAt?: Date | null;
  ticktickId?: string | null;
  ticktickProjectId?: string | null;
  ticktickEtag?: string | null;
  modifiedAt?: Date | null;
  isDeleted?: boolean;
}

export interface UpdateTaskResult {
  success: boolean;
  error?: string;
}

/**
 * Update a task with specific fields
 */
export async function updateTask(
  taskId: number,
  input: UpdateTaskInput,
): Promise<UpdateTaskResult> {
  if (IS_WEB) {
    return { success: false, error: "Tasks not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.title !== undefined) {
      updates.push("title = ?");
      values.push(input.title);
    }
    if (input.dueDate !== undefined) {
      updates.push("due_date = ?");
      values.push(input.dueDate);
    }
    if (input.priority !== undefined) {
      updates.push("priority = ?");
      values.push(input.priority);
    }
    if (input.isCompleted !== undefined) {
      updates.push("is_completed = ?");
      values.push(input.isCompleted ? 1 : 0);
    }
    if (input.completedAt !== undefined) {
      updates.push("completed_at = ?");
      values.push(input.completedAt?.getTime() || null);
    }
    if (input.ticktickId !== undefined) {
      updates.push("ticktick_id = ?");
      values.push(input.ticktickId);
    }
    if (input.ticktickProjectId !== undefined) {
      updates.push("ticktick_project_id = ?");
      values.push(input.ticktickProjectId);
    }
    if (input.ticktickEtag !== undefined) {
      updates.push("ticktick_etag = ?");
      values.push(input.ticktickEtag);
    }
    if (input.modifiedAt !== undefined) {
      updates.push("modified_at = ?");
      values.push(input.modifiedAt?.getTime() || null);
    }
    if (input.isDeleted !== undefined) {
      updates.push("is_deleted = ?");
      values.push(input.isDeleted ? 1 : 0);
    }

    if (updates.length === 0) {
      return { success: true }; // Nothing to update
    }

    values.push(taskId);
    db.runSync(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`, ...values);

    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a task by its local ID
 */
export async function getTaskById(taskId: number): Promise<TaskRecord | null> {
  if (IS_WEB) {
    return null;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const row = db.getFirstSync<TaskRow>(`SELECT * FROM tasks WHERE id = ?`, taskId);

    return row ? parseTaskRow(row) : null;
  } catch (error) {
    console.error("Failed to get task by ID:", error);
    return null;
  }
}

/**
 * Soft delete a task (mark as deleted for sync)
 */
export async function softDeleteTask(taskId: number): Promise<UpdateTaskResult> {
  if (IS_WEB) {
    return { success: false, error: "Tasks not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    db.runSync(`UPDATE tasks SET is_deleted = 1, modified_at = ? WHERE id = ?`, Date.now(), taskId);

    return { success: true };
  } catch (error) {
    console.error("Failed to soft delete task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clear TickTick sync data from all tasks (used when disconnecting)
 */
export async function clearTickTickSyncData(): Promise<UpdateTaskResult> {
  if (IS_WEB) {
    return { success: false, error: "Tasks not available on web" };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    db.runSync(
      `UPDATE tasks SET ticktick_id = NULL, ticktick_project_id = NULL, ticktick_etag = NULL`,
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to clear TickTick sync data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
