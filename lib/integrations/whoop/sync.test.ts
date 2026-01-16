import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// Mock the auth module
vi.mock("../auth", () => ({
  getTokens: vi.fn(),
  saveTokens: vi.fn(),
}));

// Mock the connection manager
vi.mock("../connection-manager", () => ({
  updateLastSync: vi.fn(),
  setSyncError: vi.fn(),
}));

describe("Whoop sync service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports syncWhoopData function", async () => {
    const { syncWhoopData } = await import("./sync");
    expect(typeof syncWhoopData).toBe("function");
  });

  it("returns error when no tokens available", async () => {
    const { getTokens } = await import("../auth");
    vi.mocked(getTokens).mockResolvedValue(null);

    const { syncWhoopData } = await import("./sync");
    const result = await syncWhoopData();

    expect(result.success).toBe(false);
    expect(result.error).toContain("token");
  });

  it("returns success with record counts on successful sync", async () => {
    const { getTokens } = await import("../auth");
    vi.mocked(getTokens).mockResolvedValue({
      accessToken: "test-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600000,
    });

    // Mock fetch for API calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/v2/recovery")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ records: [], next_token: null }),
        });
      }
      if (url.includes("/v2/activity/sleep")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ records: [], next_token: null }),
        });
      }
      if (url.includes("/v2/cycle")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ records: [], next_token: null }),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    const { syncWhoopData } = await import("./sync");
    const result = await syncWhoopData();

    expect(result.success).toBe(true);
    expect(result.recoveryCount).toBeDefined();
    expect(result.sleepCount).toBeDefined();
    expect(result.cycleCount).toBeDefined();
  });

  it("handles API errors gracefully", async () => {
    const { getTokens } = await import("../auth");
    vi.mocked(getTokens).mockResolvedValue({
      accessToken: "test-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 3600000,
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { syncWhoopData } = await import("./sync");
    const result = await syncWhoopData();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("refreshes token when expired", async () => {
    const { getTokens, saveTokens } = await import("../auth");
    // First call returns expired token, will need refresh
    vi.mocked(getTokens).mockResolvedValue({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 1000, // Expired
    });

    // Mock the token refresh endpoint
    global.fetch = vi.fn().mockImplementation((url: string, _options?: RequestInit) => {
      if (url.includes("/oauth/oauth2/token")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "new-access-token",
              refresh_token: "new-refresh-token",
              expires_in: 3600,
            }),
        });
      }
      // After refresh, API calls should work
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ records: [], next_token: null }),
      });
    });

    const { syncWhoopData } = await import("./sync");
    await syncWhoopData();

    expect(vi.mocked(saveTokens)).toHaveBeenCalledWith(
      "whoop",
      expect.objectContaining({
        accessToken: "new-access-token",
      }),
    );
  });

  it("skips sync on non-iOS platforms", async () => {
    vi.doMock("react-native", () => ({
      Platform: { OS: "web" },
    }));

    // Clear the module cache to get the new mock
    vi.resetModules();

    const { syncWhoopData } = await import("./sync");
    const result = await syncWhoopData();

    expect(result.success).toBe(false);
    expect(result.error).toContain("iOS");
  });
});
