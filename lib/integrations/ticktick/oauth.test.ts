import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-auth-session
const mockMakeRedirectUri = vi.fn();
const mockExchangeCodeAsync = vi.fn();

vi.mock("expo-auth-session", () => ({
  makeRedirectUri: (...args: unknown[]) => mockMakeRedirectUri(...args),
  exchangeCodeAsync: (...args: unknown[]) => mockExchangeCodeAsync(...args),
  ResponseType: { Code: "code" },
}));

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// Mock expo-secure-store
vi.mock("expo-secure-store", () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

// Mock connection manager
const mockUpdateConnection = vi.fn();
vi.mock("../connection-manager", () => ({
  updateConnection: (...args: unknown[]) => mockUpdateConnection(...args),
}));

// Mock auth module
const mockSaveTokens = vi.fn();
vi.mock("../auth", () => ({
  saveTokens: (...args: unknown[]) => mockSaveTokens(...args),
}));

describe("TickTick OAuth Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export correct OAuth URLs", async () => {
    const { TICKTICK_AUTH_URL, TICKTICK_TOKEN_URL } = await import("./oauth");

    expect(TICKTICK_AUTH_URL).toBe("https://ticktick.com/oauth/authorize");
    expect(TICKTICK_TOKEN_URL).toBe("https://ticktick.com/oauth/token");
  });

  it("should export required OAuth scopes", async () => {
    const { TICKTICK_SCOPES } = await import("./oauth");

    expect(TICKTICK_SCOPES).toContain("tasks:read");
    expect(TICKTICK_SCOPES).toContain("tasks:write");
    expect(TICKTICK_SCOPES).toHaveLength(2);
  });
});

describe("exchangeTickTickCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should exchange authorization code for tokens", async () => {
    const mockTokenResponse = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresIn: 15552000, // ~6 months
    };
    mockExchangeCodeAsync.mockResolvedValue(mockTokenResponse);
    mockSaveTokens.mockResolvedValue(undefined);
    mockUpdateConnection.mockResolvedValue(true);

    const { exchangeTickTickCode } = await import("./oauth");
    const result = await exchangeTickTickCode("test-auth-code", "test-redirect-uri");

    expect(result.success).toBe(true);
    expect(mockExchangeCodeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "test-auth-code",
        redirectUri: "test-redirect-uri",
      }),
      expect.objectContaining({
        tokenEndpoint: "https://ticktick.com/oauth/token",
      }),
    );
  });

  it("should save tokens to secure storage after successful exchange", async () => {
    const mockTokenResponse = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresIn: 15552000,
    };
    mockExchangeCodeAsync.mockResolvedValue(mockTokenResponse);
    mockSaveTokens.mockResolvedValue(undefined);
    mockUpdateConnection.mockResolvedValue(true);

    const { exchangeTickTickCode } = await import("./oauth");
    await exchangeTickTickCode("test-auth-code", "test-redirect-uri");

    expect(mockSaveTokens).toHaveBeenCalledWith(
      "ticktick",
      expect.objectContaining({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      }),
    );
  });

  it("should update connection status to connected after successful exchange", async () => {
    const mockTokenResponse = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresIn: 15552000,
    };
    mockExchangeCodeAsync.mockResolvedValue(mockTokenResponse);
    mockSaveTokens.mockResolvedValue(undefined);
    mockUpdateConnection.mockResolvedValue(true);

    const { exchangeTickTickCode } = await import("./oauth");
    await exchangeTickTickCode("test-auth-code", "test-redirect-uri");

    expect(mockUpdateConnection).toHaveBeenCalledWith({
      service: "ticktick",
      status: "connected",
    });
  });

  it("should return error on failed token exchange", async () => {
    mockExchangeCodeAsync.mockRejectedValue(new Error("Network error"));

    const { exchangeTickTickCode } = await import("./oauth");
    const result = await exchangeTickTickCode("test-auth-code", "test-redirect-uri");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("getTickTickRedirectUri", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMakeRedirectUri.mockReturnValue("likenootter://oauth/ticktick");
  });

  it("should return redirect URI using app scheme", async () => {
    const { getTickTickRedirectUri } = await import("./oauth");
    const uri = getTickTickRedirectUri();

    expect(mockMakeRedirectUri).toHaveBeenCalledWith({
      scheme: "likenootter",
      path: "oauth/ticktick",
    });
    expect(uri).toBe("likenootter://oauth/ticktick");
  });
});
