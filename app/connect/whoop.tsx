import { useState, useEffect, useCallback } from "react";
import { View, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthRequest, ResponseType } from "expo-auth-session";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";
import {
  WHOOP_AUTH_URL,
  WHOOP_SCOPES,
  getWhoopRedirectUri,
  exchangeWhoopCode,
} from "@/lib/integrations/whoop";
import { useConnections, disconnectService } from "@/lib/integrations/connection-manager";

const WHOOP_CLIENT_ID = process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID ?? "";

export default function WhoopConnectScreen() {
  const router = useRouter();
  const { isConnected, refresh } = useConnections();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  const redirectUri = getWhoopRedirectUri();
  const isWhoopConnected = isConnected("whoop");

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: WHOOP_CLIENT_ID,
      scopes: WHOOP_SCOPES,
      redirectUri,
      responseType: ResponseType.Code,
    },
    {
      authorizationEndpoint: WHOOP_AUTH_URL,
    },
  );

  const handleExchangeCode = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError(null);

      const result = await exchangeWhoopCode(code, redirectUri);

      if (result.success) {
        await refresh();
        setProfileName("Connected");
      } else {
        setError(result.error ?? "Failed to connect");
      }

      setIsLoading(false);
    },
    [redirectUri, refresh],
  );

  useEffect(() => {
    if (response?.type === "success" && response.params.code) {
      handleExchangeCode(response.params.code);
    } else if (response?.type === "error") {
      setError(response.params.error_description ?? "Authorization denied");
    }
  }, [response, handleExchangeCode]);

  const handleConnect = async () => {
    setError(null);
    await promptAsync();
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    await disconnectService("whoop");
    await refresh();
    setProfileName(null);
    setIsLoading(false);
  };

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-connect-whoop"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">Whoop connection requires iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-connect-whoop" className="flex-1 bg-background p-6">
      {/* Service Icon */}
      <View className="mb-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MaterialCommunityIcons name="watch" size={48} color="#00A2E8" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-foreground">Connect Whoop</Text>
      </View>

      {/* Success State */}
      {isWhoopConnected && (
        <View testID="whoop-connected-state" className="mb-6 rounded-lg bg-green-500/10 p-4">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text className="ml-2 text-base font-semibold text-green-600">
              {profileName ?? "Connected to Whoop"}
            </Text>
          </View>
          <Text className="mt-2 text-sm text-muted-foreground">
            Your Whoop data is now syncing with the app.
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View testID="whoop-error-state" className="mb-6 rounded-lg bg-destructive/10 p-4">
          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text className="ml-2 text-base font-semibold text-destructive">{error}</Text>
          </View>
        </View>
      )}

      {/* Data Access Info */}
      <View testID="whoop-data-info" className="mb-6 rounded-lg bg-card p-4">
        <Text className="mb-3 text-base font-semibold text-foreground">Data Access</Text>
        <Text className="text-sm text-muted-foreground">
          Connecting your Whoop account will allow access to:
        </Text>
        <View className="mt-3">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="heart" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Recovery scores</Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <Ionicons name="bed" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Sleep data</Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <Ionicons name="flash" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Strain scores</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="barbell" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Workout data</Text>
          </View>
        </View>
      </View>

      {/* Connect/Disconnect Button */}
      {isWhoopConnected ? (
        <TouchableOpacity
          testID="whoop-disconnect-button"
          className="rounded-lg border border-destructive bg-transparent py-4"
          onPress={handleDisconnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-center text-base font-semibold text-destructive">
              Disconnect Whoop
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          testID="whoop-connect-button"
          className="rounded-lg bg-primary py-4"
          onPress={handleConnect}
          disabled={!request || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-primary-foreground">
              Connect Whoop Account
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        testID="whoop-cancel-button"
        className="mt-3 py-4"
        onPress={() => router.back()}
      >
        <Text className="text-center text-base text-muted-foreground">
          {isWhoopConnected ? "Done" : "Cancel"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
