import "../global.css";

import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "@rn-primitives/portal";
import { DatabaseProvider } from "@/providers/DatabaseProvider";
import { HealthKitProvider, useHealthKit } from "@/providers/HealthKitProvider";
import { HealthKitSyncProvider } from "@/providers/HealthKitSyncProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { HealthKitOnboarding } from "@/components/HealthKitOnboarding";
import { Text } from "@/components/ui/text";

function AppContent() {
  const { hasCompletedOnboarding, isLoading, isAvailable } = useHealthKit();

  if (isLoading) {
    return (
      <View testID="healthkit-loading" className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  // Show onboarding if available on iOS and not completed
  if (isAvailable && !hasCompletedOnboarding) {
    return <HealthKitOnboarding />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="workout/setup"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Start Workout",
          }}
        />
        <Stack.Screen
          name="workout/active"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="workout/summary"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      <PortalHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <DatabaseProvider>
        <HealthKitProvider>
          <HealthKitSyncProvider>
            <AppContent />
          </HealthKitSyncProvider>
        </HealthKitProvider>
      </DatabaseProvider>
    </QueryProvider>
  );
}
