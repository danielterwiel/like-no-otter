import { makeRedirectUri, exchangeCodeAsync } from "expo-auth-session";
import { saveTokens } from "../auth";
import { updateConnection } from "../connection-manager";

export const TICKTICK_AUTH_URL = "https://ticktick.com/oauth/authorize";
export const TICKTICK_TOKEN_URL = "https://ticktick.com/oauth/token";

export const TICKTICK_SCOPES = ["tasks:read", "tasks:write"];

interface ExchangeResult {
  success: boolean;
  error?: string;
}

export function getTickTickRedirectUri(): string {
  return makeRedirectUri({
    scheme: "likenootter",
    path: "oauth/ticktick",
  });
}

export async function exchangeTickTickCode(
  code: string,
  redirectUri: string,
): Promise<ExchangeResult> {
  try {
    const tokenResponse = await exchangeCodeAsync(
      {
        code,
        redirectUri,
        clientId: process.env.EXPO_PUBLIC_TICKTICK_CLIENT_ID ?? "",
        extraParams: {
          client_secret: process.env.EXPO_PUBLIC_TICKTICK_CLIENT_SECRET ?? "",
        },
      },
      {
        tokenEndpoint: TICKTICK_TOKEN_URL,
      },
    );

    const expiresAt = tokenResponse.expiresIn
      ? Date.now() + tokenResponse.expiresIn * 1000
      : undefined;

    await saveTokens("ticktick", {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken ?? undefined,
      expiresAt,
    });

    await updateConnection({
      service: "ticktick",
      status: "connected",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to exchange TickTick authorization code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
