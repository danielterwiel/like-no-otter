import { getTokens } from "../auth";

const TICKTICK_API_BASE = "https://api.ticktick.com/open/v1";

export interface TickTickProject {
  id: string;
  name: string;
  color?: string;
  sortOrder?: number;
  closed?: boolean;
  groupId?: string;
  viewMode?: string;
  permission?: string;
  kind?: string;
}

export interface TickTickTask {
  id: string;
  projectId: string;
  title: string;
  content?: string;
  desc?: string;
  isAllDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminders?: string[];
  repeatFlag?: string;
  priority: number; // 0=none, 1=low, 3=medium, 5=high
  status: number; // 0=normal, 2=completed
  completedTime?: string;
  sortOrder?: number;
  items?: unknown[];
  modifiedTime?: string;
  etag?: string;
  deleted?: number;
  createdTime?: string;
  creator?: number;
  focusSummaries?: unknown[];
  columnId?: string;
  kind?: string;
}

export interface FetchProjectsResult {
  success: boolean;
  projects?: TickTickProject[];
  error?: string;
}

export interface FetchTasksResult {
  success: boolean;
  tasks?: TickTickTask[];
  error?: string;
}

export interface CreateTaskResult {
  success: boolean;
  task?: TickTickTask;
  error?: string;
}

export interface UpdateTaskResult {
  success: boolean;
  task?: TickTickTask;
  error?: string;
}

export interface CompleteTaskResult {
  success: boolean;
  error?: string;
}

export async function fetchTickTickProjects(): Promise<FetchProjectsResult> {
  try {
    const tokens = await getTokens("ticktick");
    if (!tokens) {
      return { success: false, error: "No tokens available" };
    }

    const response = await fetch(`${TICKTICK_API_BASE}/project`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TickTick API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const projects: TickTickProject[] = await response.json();

    return {
      success: true,
      projects: projects.filter((p) => !p.closed),
    };
  } catch (error) {
    console.error("Failed to fetch TickTick projects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch tasks from a specific TickTick project
 */
export async function fetchTickTickTasks(projectId: string): Promise<FetchTasksResult> {
  try {
    const tokens = await getTokens("ticktick");
    if (!tokens) {
      return { success: false, error: "No tokens available" };
    }

    const response = await fetch(`${TICKTICK_API_BASE}/project/${projectId}/data`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TickTick API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const tasks: TickTickTask[] = data.tasks || [];

    return {
      success: true,
      tasks: tasks.filter((t) => t.deleted !== 1),
    };
  } catch (error) {
    console.error("Failed to fetch TickTick tasks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a new task in TickTick
 */
export async function createTickTickTask(
  projectId: string,
  title: string,
  options?: {
    dueDate?: string; // ISO date string
    priority?: number; // 0=none, 1=low, 3=medium, 5=high
  },
): Promise<CreateTaskResult> {
  try {
    const tokens = await getTokens("ticktick");
    if (!tokens) {
      return { success: false, error: "No tokens available" };
    }

    const body: Record<string, unknown> = {
      title,
      projectId,
    };

    if (options?.dueDate) {
      body.dueDate = options.dueDate;
    }

    if (options?.priority !== undefined) {
      body.priority = options.priority;
    }

    const response = await fetch(`${TICKTICK_API_BASE}/task`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TickTick API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const task: TickTickTask = await response.json();

    return {
      success: true,
      task,
    };
  } catch (error) {
    console.error("Failed to create TickTick task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an existing task in TickTick
 */
export async function updateTickTickTask(
  taskId: string,
  projectId: string,
  updates: {
    title?: string;
    dueDate?: string | null;
    priority?: number;
  },
): Promise<UpdateTaskResult> {
  try {
    const tokens = await getTokens("ticktick");
    if (!tokens) {
      return { success: false, error: "No tokens available" };
    }

    const body: Record<string, unknown> = {
      id: taskId,
      projectId,
    };

    if (updates.title !== undefined) {
      body.title = updates.title;
    }

    if (updates.dueDate !== undefined) {
      body.dueDate = updates.dueDate;
    }

    if (updates.priority !== undefined) {
      body.priority = updates.priority;
    }

    const response = await fetch(`${TICKTICK_API_BASE}/task/${taskId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TickTick API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const task: TickTickTask = await response.json();

    return {
      success: true,
      task,
    };
  } catch (error) {
    console.error("Failed to update TickTick task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Complete a task in TickTick
 */
export async function completeTickTickTask(
  taskId: string,
  projectId: string,
): Promise<CompleteTaskResult> {
  try {
    const tokens = await getTokens("ticktick");
    if (!tokens) {
      return { success: false, error: "No tokens available" };
    }

    const response = await fetch(
      `${TICKTICK_API_BASE}/project/${projectId}/task/${taskId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TickTick API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to complete TickTick task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Uncomplete a task in TickTick (reopen it)
 * Note: TickTick API may not support this directly, so we update status to 0
 */
export async function uncompleteTickTickTask(
  taskId: string,
  projectId: string,
): Promise<UpdateTaskResult> {
  try {
    const tokens = await getTokens("ticktick");
    if (!tokens) {
      return { success: false, error: "No tokens available" };
    }

    const body = {
      id: taskId,
      projectId,
      status: 0,
    };

    const response = await fetch(`${TICKTICK_API_BASE}/task/${taskId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TickTick API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const task: TickTickTask = await response.json();

    return {
      success: true,
      task,
    };
  } catch (error) {
    console.error("Failed to uncomplete TickTick task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
