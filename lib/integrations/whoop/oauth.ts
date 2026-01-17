import { makeRedirectUri, exchangeCodeAsync } from "expo-auth-session";
import { saveTokens } from "../auth";
import { updateConnection } from "../connection-manager";

export const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export const WHOOP_SCOPES = [
  "read:recovery",
  "read:sleep",
  "read:cycles",
  "read:workout",
  "read:profile",
  "read:body_measurement",
  "offline",
];

export interface ExchangeResult {
  success: boolean;
  error?: string;
}

export function getWhoopRedirectUri(): string {
  return makeRedirectUri({
    scheme: "likenootter",
    path: "oauth/whoop",
  });
}

export async function exchangeWhoopCode(
  code: string,
  redirectUri: string,
): Promise<ExchangeResult> {
  try {
    const tokenResponse = await exchangeCodeAsync(
      {
        code,
        redirectUri,
        clientId: process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID ?? "",
        extraParams: {
          client_secret: process.env.EXPO_PUBLIC_WHOOP_CLIENT_SECRET ?? "",
        },
      },
      {
        tokenEndpoint: WHOOP_TOKEN_URL,
      },
    );

    const expiresAt = tokenResponse.expiresIn
      ? Date.now() + tokenResponse.expiresIn * 1000
      : undefined;

    await saveTokens("whoop", {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken ?? undefined,
      expiresAt,
    });

    await updateConnection({
      service: "whoop",
      status: "connected",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to exchange Whoop authorization code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
