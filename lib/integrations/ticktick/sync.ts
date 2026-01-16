import { Platform } from "react-native";
import type { TaskPriority, TaskRecord } from "@/lib/db/queries/tasks";
import {
  getTickTickSyncedTasks,
  getLocalOnlyTasks,
  createSyncedTask,
  updateTask,
} from "@/lib/db/queries/tasks";
import { getConnection, updateLastSync, setSyncError } from "../connection-manager";
import { getConnectionMetadata } from "../connection-manager";
import {
  fetchTickTickTasks,
  createTickTickTask,
  updateTickTickTask,
  completeTickTickTask,
  uncompleteTickTickTask,
  type TickTickTask,
} from "./api";

const IS_WEB = Platform.OS === "web";

// Priority mapping: TickTick 0=none, 1=low, 3=medium, 5=high
// App: 'none', 'low', 'medium', 'high'

export function ticktickPriorityToApp(priority: number): TaskPriority {
  switch (priority) {
    case 5:
      return "high";
    case 3:
      return "medium";
    case 1:
      return "low";
    default:
      return "none";
  }
}

export function appPriorityToTickTick(priority: TaskPriority): number {
  switch (priority) {
    case "high":
      return 5;
    case "medium":
      return 3;
    case "low":
      return 1;
    default:
      return 0;
  }
}

/**
 * Parse TickTick date string to ISO date (YYYY-MM-DD)
 * TickTick returns dates in various formats
 */
function parseTickTickDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

/**
 * Parse TickTick modified time to Date
 */
function parseTickTickModifiedTime(modifiedTime: string | undefined): Date | null {
  if (!modifiedTime) return null;
  try {
    const date = new Date(modifiedTime);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export interface SyncResult {
  success: boolean;
  error?: string;
  created: number;
  updated: number;
  pushed: number;
  timestamp: Date;
}

export interface TickTickMetadata {
  selectedProjectIds?: string[];
}

/**
 * Sync tasks bidirectionally between local database and TickTick
 *
 * Sync logic:
 * 1. Fetch all tasks from selected TickTick projects
 * 2. For each remote task:
 *    - If no local match: create locally
 *    - If local match exists: compare modified times, update older one
 * 3. For each local-only task: push to first selected TickTick project
 * 4. Sync completion status bidirectionally
 */
export async function syncTickTickTasks(): Promise<SyncResult> {
  const timestamp = new Date();

  if (IS_WEB) {
    return {
      success: false,
      error: "TickTick sync not available on web",
      created: 0,
      updated: 0,
      pushed: 0,
      timestamp,
    };
  }

  try {
    // Check if TickTick is connected
    const connection = await getConnection("ticktick");
    if (!connection || connection.status !== "connected") {
      return {
        success: false,
        error: "TickTick not connected",
        created: 0,
        updated: 0,
        pushed: 0,
        timestamp,
      };
    }

    // Get selected project IDs from metadata
    const metadata = await getConnectionMetadata<TickTickMetadata>("ticktick");
    const projectIds = metadata?.selectedProjectIds || [];

    if (projectIds.length === 0) {
      return {
        success: false,
        error: "No projects selected for sync",
        created: 0,
        updated: 0,
        pushed: 0,
        timestamp,
      };
    }

    let created = 0;
    let updated = 0;
    let pushed = 0;

    // Fetch tasks from all selected projects
    const allRemoteTasks: TickTickTask[] = [];
    for (const projectId of projectIds) {
      const result = await fetchTickTickTasks(projectId);
      if (result.success && result.tasks) {
        allRemoteTasks.push(...result.tasks);
      }
    }

    // Get all locally synced tasks
    const localSyncedTasks = await getTickTickSyncedTasks();
    const localTasksByTickTickId = new Map<string, TaskRecord>();
    for (const task of localSyncedTasks) {
      if (task.ticktickId) {
        localTasksByTickTickId.set(task.ticktickId, task);
      }
    }

    // Process remote tasks - pull changes from TickTick
    for (const remoteTask of allRemoteTasks) {
      const localTask = localTasksByTickTickId.get(remoteTask.id);

      if (!localTask) {
        // Remote task doesn't exist locally - create it
        const isCompleted = remoteTask.status === 2;
        const result = await createSyncedTask({
          title: remoteTask.title,
          dueDate: parseTickTickDate(remoteTask.dueDate),
          priority: ticktickPriorityToApp(remoteTask.priority),
          isCompleted,
          completedAt:
            isCompleted && remoteTask.completedTime ? new Date(remoteTask.completedTime) : null,
          ticktickId: remoteTask.id,
          ticktickProjectId: remoteTask.projectId,
          ticktickEtag: remoteTask.etag,
          modifiedAt: parseTickTickModifiedTime(remoteTask.modifiedTime),
        });

        if (result.success) {
          created++;
        }
      } else {
        // Task exists both locally and remotely - compare and sync
        const remoteModified = parseTickTickModifiedTime(remoteTask.modifiedTime);
        const localModified = localTask.modifiedAt;

        // Determine which version is newer (remote wins if times are equal or missing)
        const remoteIsNewer =
          !localModified || !remoteModified || remoteModified.getTime() >= localModified.getTime();

        if (remoteIsNewer) {
          // Pull remote changes to local
          const isCompleted = remoteTask.status === 2;
          const result = await updateTask(localTask.id, {
            title: remoteTask.title,
            dueDate: parseTickTickDate(remoteTask.dueDate),
            priority: ticktickPriorityToApp(remoteTask.priority),
            isCompleted,
            completedAt:
              isCompleted && remoteTask.completedTime ? new Date(remoteTask.completedTime) : null,
            ticktickEtag: remoteTask.etag,
            modifiedAt: remoteModified,
          });

          if (result.success) {
            updated++;
          }
        } else {
          // Push local changes to remote
          const syncResult = await pushLocalChangesToTickTick(localTask, remoteTask);
          if (syncResult) {
            updated++;
          }
        }

        // Remove from map to track which local tasks we've processed
        localTasksByTickTickId.delete(remoteTask.id);
      }
    }

    // Check for local synced tasks that no longer exist remotely (deleted on TickTick)
    // Mark them as deleted locally
    for (const [, localTask] of localTasksByTickTickId) {
      if (localTask.ticktickId && !localTask.isDeleted) {
        await updateTask(localTask.id, { isDeleted: true });
      }
    }

    // Push local-only tasks to TickTick (use first selected project)
    const defaultProjectId = projectIds[0];
    const localOnlyTasks = await getLocalOnlyTasks();

    for (const localTask of localOnlyTasks) {
      const result = await createTickTickTask(defaultProjectId, localTask.title, {
        dueDate: localTask.dueDate || undefined,
        priority: appPriorityToTickTick(localTask.priority),
      });

      if (result.success && result.task) {
        // Update local task with TickTick ID
        await updateTask(localTask.id, {
          ticktickId: result.task.id,
          ticktickProjectId: result.task.projectId,
          ticktickEtag: result.task.etag,
        });

        // Sync completion status if needed
        if (localTask.isCompleted) {
          await completeTickTickTask(result.task.id, result.task.projectId);
        }

        pushed++;
      }
    }

    // Update last sync timestamp
    await updateLastSync("ticktick");

    return {
      success: true,
      created,
      updated,
      pushed,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("TickTick sync failed:", errorMessage);
    await setSyncError("ticktick", errorMessage);

    return {
      success: false,
      error: errorMessage,
      created: 0,
      updated: 0,
      pushed: 0,
      timestamp,
    };
  }
}

/**
 * Push local task changes to TickTick
 */
async function pushLocalChangesToTickTick(
  localTask: TaskRecord,
  remoteTask: TickTickTask,
): Promise<boolean> {
  try {
    // Check if completion status changed
    const localCompleted = localTask.isCompleted;
    const remoteCompleted = remoteTask.status === 2;

    if (localCompleted !== remoteCompleted) {
      if (localCompleted) {
        await completeTickTickTask(remoteTask.id, remoteTask.projectId);
      } else {
        await uncompleteTickTickTask(remoteTask.id, remoteTask.projectId);
      }
    }

    // Check if other fields changed
    const titleChanged = localTask.title !== remoteTask.title;
    const dueDateChanged = localTask.dueDate !== parseTickTickDate(remoteTask.dueDate);
    const priorityChanged = appPriorityToTickTick(localTask.priority) !== remoteTask.priority;

    if (titleChanged || dueDateChanged || priorityChanged) {
      const result = await updateTickTickTask(remoteTask.id, remoteTask.projectId, {
        title: localTask.title,
        dueDate: localTask.dueDate,
        priority: appPriorityToTickTick(localTask.priority),
      });

      if (result.success && result.task) {
        // Update local etag
        await updateTask(localTask.id, {
          ticktickEtag: result.task.etag,
        });
      }

      return result.success;
    }

    return true;
  } catch (error) {
    console.error("Failed to push local changes to TickTick:", error);
    return false;
  }
}

// Debounced sync support
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let syncPromise: Promise<SyncResult> | null = null;

/**
 * Trigger a debounced sync (5 second delay)
 * Multiple calls within the delay period will only trigger one sync
 */
export function triggerDebouncedSync(): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    syncTimeout = null;
    if (!syncPromise) {
      syncPromise = syncTickTickTasks();
      try {
        await syncPromise;
      } finally {
        syncPromise = null;
      }
    }
  }, 5000);
}

/**
 * Check if a sync is currently in progress
 */
export function isSyncing(): boolean {
  return syncPromise !== null;
}
