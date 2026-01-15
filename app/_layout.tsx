import "../global.css";

import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "@rn-primitives/portal";
import { DatabaseProvider } from "@/providers/DatabaseProvider";
import { HealthKitProvider, useHealthKit } from "@/providers/HealthKitProvider";
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
      </Stack>
      <StatusBar style="auto" />
      <PortalHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <HealthKitProvider>
        <AppContent />
      </HealthKitProvider>
    </DatabaseProvider>
  );
}
