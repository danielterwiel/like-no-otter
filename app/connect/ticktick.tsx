import { useState, useEffect, useCallback } from "react";
import { View, Platform, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthRequest, ResponseType } from "expo-auth-session";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";
import {
  TICKTICK_AUTH_URL,
  TICKTICK_SCOPES,
  getTickTickRedirectUri,
  exchangeTickTickCode,
  fetchTickTickProjects,
  type TickTickProject,
} from "@/lib/integrations/ticktick";
import {
  useConnections,
  disconnectService,
  updateConnectionMetadata,
  getConnectionMetadata,
} from "@/lib/integrations/connection-manager";

const TICKTICK_CLIENT_ID = process.env.EXPO_PUBLIC_TICKTICK_CLIENT_ID ?? "";

interface TickTickMetadata {
  selectedProjectIds: string[];
}

type ScreenState = "initial" | "project-selection" | "connected";

export default function TickTickConnectScreen() {
  const router = useRouter();
  const { isConnected, refresh } = useConnections();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>("initial");
  const [projects, setProjects] = useState<TickTickProject[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const redirectUri = getTickTickRedirectUri();
  const isTickTickConnected = isConnected("ticktick");

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: TICKTICK_CLIENT_ID,
      scopes: TICKTICK_SCOPES,
      redirectUri,
      responseType: ResponseType.Code,
    },
    {
      authorizationEndpoint: TICKTICK_AUTH_URL,
    },
  );

  // Load existing connection state
  useEffect(() => {
    async function loadConnectionState() {
      if (isTickTickConnected) {
        const metadata = await getConnectionMetadata<TickTickMetadata>("ticktick");
        if (metadata?.selectedProjectIds) {
          setSelectedProjectIds(metadata.selectedProjectIds);
        }
        setScreenState("connected");
      }
    }
    loadConnectionState();
  }, [isTickTickConnected]);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchTickTickProjects();

    if (result.success && result.projects) {
      setProjects(result.projects);
      setScreenState("project-selection");
    } else {
      setError(result.error ?? "Failed to load projects");
    }

    setIsLoading(false);
  }, []);

  const handleExchangeCode = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError(null);

      const result = await exchangeTickTickCode(code, redirectUri);

      if (result.success) {
        await refresh();
        // Load projects for selection
        await loadProjects();
      } else {
        setError(result.error ?? "Failed to connect");
      }

      setIsLoading(false);
    },
    [redirectUri, refresh, loadProjects],
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
    await disconnectService("ticktick");
    await refresh();
    setSelectedProjectIds([]);
    setProjects([]);
    setScreenState("initial");
    setIsLoading(false);
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  };

  const handleSaveProjects = async () => {
    setIsLoading(true);
    setError(null);

    const success = await updateConnectionMetadata("ticktick", {
      selectedProjectIds,
    });

    if (success) {
      await refresh();
      setScreenState("connected");
    } else {
      setError("Failed to save project selection");
    }

    setIsLoading(false);
  };

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-connect-ticktick"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">TickTick connection requires iOS or Android</Text>
      </View>
    );
  }

  // Project selection screen
  if (screenState === "project-selection") {
    return (
      <View testID="screen-connect-ticktick" className="flex-1 bg-background">
        <ScrollView className="flex-1 p-6">
          <View className="mb-6 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Ionicons name="checkbox-outline" size={36} color="#4772FA" />
            </View>
            <Text className="mt-4 text-xl font-bold text-foreground">Select Projects</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Choose which TickTick projects to sync with the app
            </Text>
          </View>

          {error && (
            <View testID="ticktick-error-state" className="mb-4 rounded-lg bg-destructive/10 p-4">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="ml-2 text-sm text-destructive">{error}</Text>
              </View>
            </View>
          )}

          <View testID="ticktick-project-list" className="mb-6">
            {projects.map((project) => {
              const isSelected = selectedProjectIds.includes(project.id);
              return (
                <TouchableOpacity
                  key={project.id}
                  testID={`project-${project.id}`}
                  className={`mb-2 flex-row items-center rounded-lg border p-4 ${
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                  onPress={() => handleProjectToggle(project.id)}
                >
                  <View
                    className={`mr-3 h-5 w-5 items-center justify-center rounded ${
                      isSelected ? "bg-primary" : "border border-muted-foreground"
                    }`}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text className="flex-1 text-base text-foreground">{project.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-t border-border p-6">
          <TouchableOpacity
            testID="ticktick-save-projects-button"
            className="rounded-lg bg-primary py-4"
            onPress={handleSaveProjects}
            disabled={isLoading || selectedProjectIds.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-base font-semibold text-primary-foreground">
                Save Selection ({selectedProjectIds.length})
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="ticktick-skip-button"
            className="mt-3 py-4"
            onPress={() => setScreenState("connected")}
          >
            <Text className="text-center text-base text-muted-foreground">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View testID="screen-connect-ticktick" className="flex-1 bg-background p-6">
      {/* Service Icon */}
      <View className="mb-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Ionicons name="checkbox-outline" size={48} color="#4772FA" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-foreground">Connect TickTick</Text>
      </View>

      {/* Connected State */}
      {isTickTickConnected && (
        <View testID="ticktick-connected-state" className="mb-6 rounded-lg bg-green-500/10 p-4">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text className="ml-2 text-base font-semibold text-green-600">
              Connected to TickTick
            </Text>
          </View>
          {selectedProjectIds.length > 0 && (
            <Text className="mt-2 text-sm text-muted-foreground">
              Syncing {selectedProjectIds.length} project
              {selectedProjectIds.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      )}

      {/* Error State */}
      {error && (
        <View testID="ticktick-error-state" className="mb-6 rounded-lg bg-destructive/10 p-4">
          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text className="ml-2 text-base font-semibold text-destructive">{error}</Text>
          </View>
        </View>
      )}

      {/* Sync Info */}
      <View testID="ticktick-sync-info" className="mb-6 rounded-lg bg-card p-4">
        <Text className="mb-3 text-base font-semibold text-foreground">Bidirectional Sync</Text>
        <Text className="text-sm text-muted-foreground">
          Connecting your TickTick account enables two-way sync:
        </Text>
        <View className="mt-3">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="arrow-down" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Import tasks from TickTick</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="arrow-up" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Sync app tasks to TickTick</Text>
          </View>
        </View>
      </View>

      {/* Connect/Disconnect/Edit Projects Button */}
      {isTickTickConnected ? (
        <>
          <TouchableOpacity
            testID="ticktick-edit-projects-button"
            className="mb-3 rounded-lg border border-primary bg-transparent py-4"
            onPress={loadProjects}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#4772FA" />
            ) : (
              <Text className="text-center text-base font-semibold text-primary">
                Edit Synced Projects
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            testID="ticktick-disconnect-button"
            className="rounded-lg border border-destructive bg-transparent py-4"
            onPress={handleDisconnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text className="text-center text-base font-semibold text-destructive">
                Disconnect TickTick
              </Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          testID="ticktick-connect-button"
          className="rounded-lg bg-primary py-4"
          onPress={handleConnect}
          disabled={!request || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-primary-foreground">
              Connect TickTick Account
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        testID="ticktick-cancel-button"
        className="mt-3 py-4"
        onPress={() => router.back()}
      >
        <Text className="text-center text-base text-muted-foreground">
          {isTickTickConnected ? "Done" : "Cancel"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
