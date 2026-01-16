import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-auth-session
const mockMakeRedirectUri = vi.fn();
const mockUseAuthRequest = vi.fn();
const mockExchangeCodeAsync = vi.fn();

vi.mock("expo-auth-session", () => ({
  makeRedirectUri: (...args: unknown[]) => mockMakeRedirectUri(...args),
  useAuthRequest: (...args: unknown[]) => mockUseAuthRequest(...args),
  exchangeCodeAsync: (...args: unknown[]) => mockExchangeCodeAsync(...args),
  AuthRequest: vi.fn(),
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

describe("Whoop OAuth Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export correct OAuth URLs", async () => {
    const { WHOOP_AUTH_URL, WHOOP_TOKEN_URL } = await import("./oauth");

    expect(WHOOP_AUTH_URL).toBe("https://api.whoop.com/oauth/oauth2/auth");
    expect(WHOOP_TOKEN_URL).toBe("https://api.whoop.com/oauth/oauth2/token");
  });

  it("should export all required OAuth scopes", async () => {
    const { WHOOP_SCOPES } = await import("./oauth");

    expect(WHOOP_SCOPES).toContain("read:recovery");
    expect(WHOOP_SCOPES).toContain("read:sleep");
    expect(WHOOP_SCOPES).toContain("read:cycles");
    expect(WHOOP_SCOPES).toContain("read:workout");
    expect(WHOOP_SCOPES).toContain("read:profile");
    expect(WHOOP_SCOPES).toContain("read:body_measurement");
    expect(WHOOP_SCOPES).toContain("offline");
  });
});

describe("exchangeWhoopCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should exchange authorization code for tokens", async () => {
    const mockTokenResponse = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresIn: 3600,
    };
    mockExchangeCodeAsync.mockResolvedValue(mockTokenResponse);
    mockSaveTokens.mockResolvedValue(undefined);
    mockUpdateConnection.mockResolvedValue(true);

    const { exchangeWhoopCode } = await import("./oauth");
    const result = await exchangeWhoopCode("test-auth-code", "test-redirect-uri");

    expect(result.success).toBe(true);
    expect(mockExchangeCodeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "test-auth-code",
        redirectUri: "test-redirect-uri",
      }),
      expect.objectContaining({
        tokenEndpoint: "https://api.whoop.com/oauth/oauth2/token",
      }),
    );
  });

  it("should save tokens to secure storage after successful exchange", async () => {
    const mockTokenResponse = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresIn: 3600,
    };
    mockExchangeCodeAsync.mockResolvedValue(mockTokenResponse);
    mockSaveTokens.mockResolvedValue(undefined);
    mockUpdateConnection.mockResolvedValue(true);

    const { exchangeWhoopCode } = await import("./oauth");
    await exchangeWhoopCode("test-auth-code", "test-redirect-uri");

    expect(mockSaveTokens).toHaveBeenCalledWith(
      "whoop",
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
      expiresIn: 3600,
    };
    mockExchangeCodeAsync.mockResolvedValue(mockTokenResponse);
    mockSaveTokens.mockResolvedValue(undefined);
    mockUpdateConnection.mockResolvedValue(true);

    const { exchangeWhoopCode } = await import("./oauth");
    await exchangeWhoopCode("test-auth-code", "test-redirect-uri");

    expect(mockUpdateConnection).toHaveBeenCalledWith({
      service: "whoop",
      status: "connected",
    });
  });

  it("should return error on failed token exchange", async () => {
    mockExchangeCodeAsync.mockRejectedValue(new Error("Network error"));

    const { exchangeWhoopCode } = await import("./oauth");
    const result = await exchangeWhoopCode("test-auth-code", "test-redirect-uri");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("getWhoopRedirectUri", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMakeRedirectUri.mockReturnValue("likenootter://oauth/whoop");
  });

  it("should return redirect URI using app scheme", async () => {
    const { getWhoopRedirectUri } = await import("./oauth");
    const uri = getWhoopRedirectUri();

    expect(mockMakeRedirectUri).toHaveBeenCalledWith({
      scheme: "likenootter",
      path: "oauth/whoop",
    });
    expect(uri).toBe("likenootter://oauth/whoop");
  });
});
