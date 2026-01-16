import { Platform } from "react-native";
import { getTokens, saveTokens } from "../auth";
import { updateLastSync, setSyncError } from "../connection-manager";
import {
  saveWhoopRecoveryRecords,
  saveWhoopSleepRecords,
  saveWhoopCycleRecords,
  type WhoopRecoveryData,
  type WhoopSleepData,
  type WhoopCycleData,
} from "../../db/queries/whoop";

const IS_IOS = Platform.OS === "ios";
const WHOOP_API_BASE = "https://api.whoop.com";
const WHOOP_TOKEN_URL = "https://api.whoop.com/oauth/oauth2/token";

export interface SyncWhoopResult {
  success: boolean;
  error?: string;
  recoveryCount?: number;
  sleepCount?: number;
  cycleCount?: number;
  syncedAt?: Date;
}

interface WhoopApiResponse<T> {
  records: T[];
  next_token: string | null;
}

interface WhoopRecoveryRecord {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}

interface WhoopSleepRecord {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate?: number;
    sleep_performance_percentage?: number;
    sleep_consistency_percentage?: number;
    sleep_efficiency_percentage?: number;
  };
}

interface WhoopCycleRecord {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score?: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

async function refreshToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID ?? "",
        client_secret: process.env.EXPO_PUBLIC_WHOOP_CLIENT_SECRET ?? "",
      }).toString(),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    await saveTokens("whoop", {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return true;
  } catch (error) {
    console.error("Failed to refresh Whoop token:", error);
    return false;
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<WhoopApiResponse<T>> {
  const url = new URL(`${WHOOP_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Whoop API error: ${response.status}`);
  }

  return response.json();
}

async function fetchAllPages<T>(
  endpoint: string,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<T[]> {
  const allRecords: T[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start: startDate,
      end: endDate,
    };
    if (nextToken) {
      params.nextToken = nextToken;
    }

    const response = await fetchWithAuth<T>(endpoint, accessToken, params);
    allRecords.push(...response.records);
    nextToken = response.next_token;
  } while (nextToken);

  return allRecords;
}

export async function syncWhoopData(): Promise<SyncWhoopResult> {
  // Skip sync on non-iOS platforms
  if (!IS_IOS) {
    return {
      success: false,
      error: "Whoop sync only available on iOS",
    };
  }

  try {
    // Get tokens from secure storage
    let tokens = await getTokens("whoop");
    if (!tokens) {
      return {
        success: false,
        error: "No Whoop token available. Please connect your Whoop account.",
      };
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
      if (!tokens.refreshToken) {
        return {
          success: false,
          error: "Whoop token expired and no refresh token available.",
        };
      }

      const refreshed = await refreshToken(tokens.refreshToken);
      if (!refreshed) {
        return {
          success: false,
          error: "Failed to refresh Whoop token. Please reconnect.",
        };
      }

      // Get the new tokens
      tokens = await getTokens("whoop");
      if (!tokens) {
        return {
          success: false,
          error: "Failed to retrieve refreshed token.",
        };
      }
    }

    // Calculate date range (last 30 days for initial, or since last sync)
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data types in parallel
    const [recoveryRecords, sleepRecords, cycleRecords] = await Promise.all([
      fetchAllPages<WhoopRecoveryRecord>("/v2/recovery", tokens.accessToken, startDate, endDate),
      fetchAllPages<WhoopSleepRecord>("/v2/activity/sleep", tokens.accessToken, startDate, endDate),
      fetchAllPages<WhoopCycleRecord>("/v2/cycle", tokens.accessToken, startDate, endDate),
    ]);

    // Transform and save recovery records
    const recoveryData: WhoopRecoveryData[] = recoveryRecords.map((r) => ({
      whoopId: String(r.cycle_id),
      date: r.created_at.split("T")[0],
      recoveryScore: r.score?.recovery_score ?? null,
      hrvRmssd: r.score?.hrv_rmssd_milli ? r.score.hrv_rmssd_milli / 1000 : null, // Convert to seconds
      restingHeartRate: r.score?.resting_heart_rate ?? null,
      spo2: r.score?.spo2_percentage ?? null,
      skinTemp: r.score?.skin_temp_celsius ?? null,
    }));

    // Transform and save sleep records
    const sleepData: WhoopSleepData[] = sleepRecords
      .filter((s) => !s.nap) // Exclude naps, only count main sleep
      .map((s) => ({
        whoopId: String(s.id),
        date: s.start.split("T")[0],
        startTime: new Date(s.start),
        endTime: new Date(s.end),
        qualityDuration: s.score?.stage_summary
          ? Math.round(
              (s.score.stage_summary.total_light_sleep_time_milli +
                s.score.stage_summary.total_slow_wave_sleep_time_milli +
                s.score.stage_summary.total_rem_sleep_time_milli) /
                1000,
            )
          : null,
        remDuration: s.score?.stage_summary
          ? Math.round(s.score.stage_summary.total_rem_sleep_time_milli / 1000)
          : null,
        deepDuration: s.score?.stage_summary
          ? Math.round(s.score.stage_summary.total_slow_wave_sleep_time_milli / 1000)
          : null,
        lightDuration: s.score?.stage_summary
          ? Math.round(s.score.stage_summary.total_light_sleep_time_milli / 1000)
          : null,
        awakeDuration: s.score?.stage_summary
          ? Math.round(s.score.stage_summary.total_awake_time_milli / 1000)
          : null,
        respiratoryRate: s.score?.respiratory_rate ?? null,
      }));

    // Transform and save cycle records
    const cycleData: WhoopCycleData[] = cycleRecords.map((c) => ({
      whoopId: String(c.id),
      date: c.start.split("T")[0],
      strain: c.score?.strain ?? null,
      kilojoules: c.score?.kilojoule ?? null,
      avgHeartRate: c.score?.average_heart_rate ?? null,
      maxHeartRate: c.score?.max_heart_rate ?? null,
    }));

    // Save all records to SQLite
    const [savedRecovery, savedSleep, savedCycles] = await Promise.all([
      saveWhoopRecoveryRecords(recoveryData),
      saveWhoopSleepRecords(sleepData),
      saveWhoopCycleRecords(cycleData),
    ]);

    const syncedAt = new Date();
    await updateLastSync("whoop");

    return {
      success: true,
      recoveryCount: savedRecovery,
      sleepCount: savedSleep,
      cycleCount: savedCycles,
      syncedAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
    console.error("Whoop sync failed:", errorMessage);

    await setSyncError("whoop", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
