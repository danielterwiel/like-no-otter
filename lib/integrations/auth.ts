import { Platform } from "react-native";
import type { ServiceType } from "@/lib/db/schema/connections";

const IS_NATIVE = Platform.OS === "ios" || Platform.OS === "android";

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

function getTokenKey(service: ServiceType, type: "access" | "refresh"): string {
  return `${service}_${type}_token`;
}

export async function saveTokens(service: ServiceType, tokens: TokenData): Promise<void> {
  if (!IS_NATIVE) {
    console.warn("Token storage only available on iOS/Android");
    return;
  }

  const SecureStore = await import("expo-secure-store");

  await SecureStore.setItemAsync(getTokenKey(service, "access"), tokens.accessToken);

  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(getTokenKey(service, "refresh"), tokens.refreshToken);
  }

  if (tokens.expiresAt) {
    await SecureStore.setItemAsync(`${service}_expires_at`, tokens.expiresAt.toString());
  }
}

export async function getTokens(service: ServiceType): Promise<TokenData | null> {
  if (!IS_NATIVE) {
    return null;
  }

  const SecureStore = await import("expo-secure-store");

  const accessToken = await SecureStore.getItemAsync(getTokenKey(service, "access"));
  if (!accessToken) {
    return null;
  }

  const refreshToken = await SecureStore.getItemAsync(getTokenKey(service, "refresh"));
  const expiresAtStr = await SecureStore.getItemAsync(`${service}_expires_at`);
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;

  return {
    accessToken,
    refreshToken: refreshToken ?? undefined,
    expiresAt,
  };
}

export async function clearTokens(service: ServiceType): Promise<void> {
  if (!IS_NATIVE) {
    return;
  }

  const SecureStore = await import("expo-secure-store");

  await SecureStore.deleteItemAsync(getTokenKey(service, "access"));
  await SecureStore.deleteItemAsync(getTokenKey(service, "refresh"));
  await SecureStore.deleteItemAsync(`${service}_expires_at`);
}

export async function hasValidToken(service: ServiceType): Promise<boolean> {
  const tokens = await getTokens(service);
  if (!tokens) {
    return false;
  }

  if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
    return !!tokens.refreshToken;
  }

  return true;
}
