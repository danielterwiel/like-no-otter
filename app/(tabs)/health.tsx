import * as React from "react";
import { View, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { useHealthKit } from "@/providers/HealthKitProvider";
import { HealthKitDenied } from "@/components/HealthKitDenied";
import {
  SleepCard,
  StepsCard,
  CaloriesCard,
  RHRCard,
  RHRTrendChart,
  RecoveryCard,
  StrainCard,
} from "@/components/health";
import {
  fetchTodayHealthData,
  fetchRHRTrendData,
  type HealthData,
  type RHRTrendData,
} from "@/lib/health";
import { useConnections } from "@/lib/integrations/connection-manager";
import {
  getLatestWhoopRecovery,
  getLatestWhoopCycle,
  getLatestWhoopSleep,
  type WhoopRecoveryData,
  type WhoopCycleData,
  type WhoopSleepData,
} from "@/lib/db/queries/whoop";
import { syncWhoopData } from "@/lib/integrations/whoop";
import { useToast } from "@/components/ui/toast";

export default function HealthScreen() {
  const router = useRouter();
  const { authStatus, isAvailable } = useHealthKit();
  const { isConnected } = useConnections();
  const { showToast } = useToast();
  const [healthData, setHealthData] = React.useState<HealthData | null>(null);
  const [rhrTrendData, setRhrTrendData] = React.useState<RHRTrendData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTrendLoading, setIsTrendLoading] = React.useState(true);

  // Whoop data state
  const whoopConnected = isConnected("whoop");
  const [whoopRecovery, setWhoopRecovery] = React.useState<WhoopRecoveryData | null>(null);
  const [whoopStrain, setWhoopStrain] = React.useState<WhoopCycleData | null>(null);
  const [whoopSleep, setWhoopSleep] = React.useState<WhoopSleepData | null>(null);
  const [isWhoopLoading, setIsWhoopLoading] = React.useState(true);
  const [isWhoopSyncing, setIsWhoopSyncing] = React.useState(false);

  React.useEffect(() => {
    async function loadHealthData() {
      // Only fetch on iOS when authorized
      if (Platform.OS === "ios" && authStatus === "authorized") {
        setIsLoading(true);
        setIsTrendLoading(true);
        const [data, trendData] = await Promise.all([fetchTodayHealthData(), fetchRHRTrendData()]);
        setHealthData(data);
        setRhrTrendData(trendData);
        setIsLoading(false);
        setIsTrendLoading(false);
      } else {
        // On web/non-iOS, set empty state immediately
        setIsLoading(false);
        setIsTrendLoading(false);
        setHealthData({ sleep: null, steps: null, calories: null, heartRate: null });
        setRhrTrendData({ points: [] });
      }
    }
    loadHealthData();
  }, [authStatus]);

  // Load Whoop data when connected
  React.useEffect(() => {
    async function loadWhoopData() {
      if (!whoopConnected) {
        setIsWhoopLoading(false);
        setWhoopRecovery(null);
        setWhoopStrain(null);
        setWhoopSleep(null);
        return;
      }

      setIsWhoopLoading(true);
      try {
        const [recovery, strain, sleep] = await Promise.all([
          getLatestWhoopRecovery(),
          getLatestWhoopCycle(),
          getLatestWhoopSleep(),
        ]);
        setWhoopRecovery(recovery);
        setWhoopStrain(strain);
        setWhoopSleep(sleep);
      } catch (error) {
        console.error("Failed to load Whoop data:", error);
      } finally {
        setIsWhoopLoading(false);
      }
    }
    loadWhoopData();
  }, [whoopConnected]);

  // Manual Whoop sync function
  const handleWhoopSync = React.useCallback(async () => {
    if (!whoopConnected || isWhoopSyncing) return;

    setIsWhoopSyncing(true);
    try {
      const result = await syncWhoopData();

      if (result.success) {
        // Reload Whoop data from database
        const [recovery, strain, sleep] = await Promise.all([
          getLatestWhoopRecovery(),
          getLatestWhoopCycle(),
          getLatestWhoopSleep(),
        ]);
        setWhoopRecovery(recovery);
        setWhoopStrain(strain);
        setWhoopSleep(sleep);

        // Show success toast
        if (result.error?.includes("Skipped")) {
          // Rate limited
          showToast({
            type: "info",
            title: "Already synced recently",
            description: result.error,
            duration: 3000,
          });
        } else {
          showToast({
            type: "success",
            title: "Whoop data synced",
            description: `${result.recoveryCount || 0} recovery, ${result.sleepCount || 0} sleep, ${result.cycleCount || 0} cycles`,
            duration: 3000,
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Sync failed",
          description: result.error || "Failed to sync Whoop data",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to sync Whoop:", error);
      showToast({
        type: "error",
        title: "Sync failed",
        description: "An unexpected error occurred",
        duration: 5000,
      });
    } finally {
      setIsWhoopSyncing(false);
    }
  }, [whoopConnected, isWhoopSyncing, showToast]);

  // Show denied state if on iOS and authorization was denied
  if (isAvailable && authStatus === "denied") {
    return <HealthKitDenied />;
  }

  // Show message for non-iOS users
  if (!isAvailable) {
    return (
      <View testID="screen-health" className="flex-1 items-center justify-center bg-background">
        <Text className="text-xl font-bold text-primary">Health</Text>
        <Text className="mt-4 text-muted-foreground">
          HealthKit is only available on iOS devices
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="screen-health"
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold">Today</Text>
        {whoopConnected && (
          <TouchableOpacity
            testID="whoop-sync-button"
            onPress={handleWhoopSync}
            disabled={isWhoopSyncing}
            className="rounded-lg bg-primary/10 px-3 py-2 flex-row items-center gap-2"
          >
            {isWhoopSyncing ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Ionicons name="refresh" size={16} color="#6366f1" />
            )}
            <Text className="text-sm font-medium text-primary">
              {isWhoopSyncing ? "Syncing..." : "Sync Whoop"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <SleepCard
            data={healthData?.sleep ?? null}
            whoopData={whoopSleep}
            isLoading={isLoading || isWhoopLoading}
          />
        </View>
        <View className="flex-1">
          <StepsCard data={healthData?.steps ?? null} isLoading={isLoading} />
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <CaloriesCard
            data={healthData?.calories ?? null}
            whoopData={whoopStrain}
            isLoading={isLoading || isWhoopLoading}
          />
        </View>
        <View className="flex-1">
          <RHRCard
            data={healthData?.heartRate ?? null}
            whoopData={whoopRecovery}
            isLoading={isLoading || isWhoopLoading}
          />
        </View>
      </View>

      {/* Whoop-specific metrics (only shown when connected) */}
      {whoopConnected && (
        <>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <RecoveryCard data={whoopRecovery} isLoading={isWhoopLoading} />
            </View>
            <View className="flex-1">
              <StrainCard data={whoopStrain} isLoading={isWhoopLoading} />
            </View>
          </View>
        </>
      )}

      <RHRTrendChart data={rhrTrendData} isLoading={isTrendLoading} />

      {/* Whoop Connection CTA (only shown when not connected) */}
      {!whoopConnected && (
        <View testID="whoop-empty-state" className="mt-4">
          <View className="rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="fitness-outline" size={24} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium">Connect Whoop</Text>
                <Text className="text-sm text-muted-foreground">
                  See recovery, strain, and enhanced sleep data
                </Text>
              </View>
              <TouchableOpacity
                testID="connect-whoop-cta"
                className="rounded-lg bg-primary px-4 py-2"
                onPress={() => router.push("/connect/whoop")}
              >
                <Text className="font-medium text-primary-foreground">Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
