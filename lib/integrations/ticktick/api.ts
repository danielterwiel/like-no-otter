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

export interface FetchProjectsResult {
  success: boolean;
  projects?: TickTickProject[];
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
