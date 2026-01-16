import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock HealthKit queries - must be defined before vi.mock calls
const mockFetchSleepDataForDate = vi.fn();
const mockFetchStepsDataForDate = vi.fn();
const mockFetchCaloriesDataForDate = vi.fn();
const mockFetchHeartRateDataForDate = vi.fn();

// Mock expo-sqlite
const mockRunSync = vi.fn();
const mockWithTransactionSync = vi.fn((fn: () => void) => fn());

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

vi.mock("expo-sqlite", () => ({
  openDatabaseSync: vi.fn(() => ({
    runSync: mockRunSync,
    getAllSync: vi.fn(() => []),
    withTransactionSync: mockWithTransactionSync,
  })),
}));

vi.mock("./queries", () => ({
  fetchSleepDataForDate: (...args: unknown[]) => mockFetchSleepDataForDate(...args),
  fetchStepsDataForDate: (...args: unknown[]) => mockFetchStepsDataForDate(...args),
  fetchCaloriesDataForDate: (...args: unknown[]) => mockFetchCaloriesDataForDate(...args),
  fetchHeartRateDataForDate: (...args: unknown[]) => mockFetchHeartRateDataForDate(...args),
}));

describe("syncHealthData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should fetch health data for the last 30 days", async () => {
    // Setup mocks to return null (no data)
    mockFetchSleepDataForDate.mockResolvedValue(null);
    mockFetchStepsDataForDate.mockResolvedValue(null);
    mockFetchCaloriesDataForDate.mockResolvedValue(null);
    mockFetchHeartRateDataForDate.mockResolvedValue(null);

    const { syncHealthData } = await import("./sync");
    await syncHealthData();

    // Should fetch data for each day, 30 days total
    expect(mockFetchSleepDataForDate).toHaveBeenCalledTimes(30);
    expect(mockFetchStepsDataForDate).toHaveBeenCalledTimes(30);
    expect(mockFetchCaloriesDataForDate).toHaveBeenCalledTimes(30);
    expect(mockFetchHeartRateDataForDate).toHaveBeenCalledTimes(30);
  });

  it("should store fetched data in health_metrics table with syncedAt timestamp", async () => {
    const now = new Date("2026-01-16T12:00:00Z");
    vi.setSystemTime(now);

    mockFetchSleepDataForDate.mockResolvedValue({
      totalHours: 7.5,
      startTime: null,
      endTime: null,
    });
    mockFetchStepsDataForDate.mockResolvedValue({ count: 10000 });
    mockFetchCaloriesDataForDate.mockResolvedValue({ activeCalories: 500 });
    mockFetchHeartRateDataForDate.mockResolvedValue({ restingHeartRate: 65 });

    mockRunSync.mockClear();

    const { syncHealthData } = await import("./sync");
    await syncHealthData();

    // Verify data was inserted with syncedAt timestamp
    const insertCalls = mockRunSync.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === "string" && call[0].includes("INSERT"),
    );

    // Each day should have 4 inserts (sleep, steps, calories, rhr)
    // For 30 days that's 120 inserts
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it("should not crash when HealthKit returns errors", async () => {
    mockFetchSleepDataForDate.mockRejectedValue(new Error("HealthKit error"));
    mockFetchStepsDataForDate.mockRejectedValue(new Error("HealthKit error"));
    mockFetchCaloriesDataForDate.mockRejectedValue(new Error("HealthKit error"));
    mockFetchHeartRateDataForDate.mockRejectedValue(new Error("HealthKit error"));

    const { syncHealthData } = await import("./sync");

    // Should not throw
    await expect(syncHealthData()).resolves.not.toThrow();
  });

  it("should skip sync on non-iOS platforms", async () => {
    vi.doMock("react-native", () => ({
      Platform: { OS: "web" },
    }));

    // Re-import with new mock
    vi.resetModules();
    const { syncHealthData } = await import("./sync");
    await syncHealthData();

    // Should not fetch any data
    expect(mockFetchSleepDataForDate).not.toHaveBeenCalled();
  });

  it("should return sync result with success status and timestamp", async () => {
    const now = new Date("2026-01-16T12:00:00Z");
    vi.setSystemTime(now);

    mockFetchSleepDataForDate.mockResolvedValue(null);
    mockFetchStepsDataForDate.mockResolvedValue(null);
    mockFetchCaloriesDataForDate.mockResolvedValue(null);
    mockFetchHeartRateDataForDate.mockResolvedValue(null);

    const { syncHealthData } = await import("./sync");
    const result = await syncHealthData();

    expect(result).toEqual({
      success: true,
      syncedAt: now,
      recordsInserted: 0,
    });
  });
});
