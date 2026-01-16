import * as React from "react";
import { View, ScrollView, Platform, TouchableOpacity } from "react-native";
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
  WhoopSleepCard,
  RecoveryTrendChart,
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
  getRecoveryTrendData,
  type WhoopRecoveryData,
  type WhoopCycleData,
  type WhoopSleepData,
  type RecoveryTrendData,
} from "@/lib/db/queries/whoop";

export default function HealthScreen() {
  const router = useRouter();
  const { authStatus, isAvailable } = useHealthKit();
  const { isConnected } = useConnections();
  const [healthData, setHealthData] = React.useState<HealthData | null>(null);
  const [rhrTrendData, setRhrTrendData] = React.useState<RHRTrendData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTrendLoading, setIsTrendLoading] = React.useState(true);

  // Whoop data state
  const whoopConnected = isConnected("whoop");
  const [whoopRecovery, setWhoopRecovery] = React.useState<WhoopRecoveryData | null>(null);
  const [whoopStrain, setWhoopStrain] = React.useState<WhoopCycleData | null>(null);
  const [whoopSleep, setWhoopSleep] = React.useState<WhoopSleepData | null>(null);
  const [recoveryTrend, setRecoveryTrend] = React.useState<RecoveryTrendData | null>(null);
  const [isWhoopLoading, setIsWhoopLoading] = React.useState(true);

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
        setRecoveryTrend(null);
        return;
      }

      setIsWhoopLoading(true);
      try {
        const [recovery, strain, sleep, trend] = await Promise.all([
          getLatestWhoopRecovery(),
          getLatestWhoopCycle(),
          getLatestWhoopSleep(),
          getRecoveryTrendData(7),
        ]);
        setWhoopRecovery(recovery);
        setWhoopStrain(strain);
        setWhoopSleep(sleep);
        setRecoveryTrend(trend);
      } catch (error) {
        console.error("Failed to load Whoop data:", error);
      } finally {
        setIsWhoopLoading(false);
      }
    }
    loadWhoopData();
  }, [whoopConnected]);

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
      <Text className="text-2xl font-bold">Today</Text>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <SleepCard data={healthData?.sleep ?? null} isLoading={isLoading} />
        </View>
        <View className="flex-1">
          <StepsCard data={healthData?.steps ?? null} isLoading={isLoading} />
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <CaloriesCard data={healthData?.calories ?? null} isLoading={isLoading} />
        </View>
        <View className="flex-1">
          <RHRCard data={healthData?.heartRate ?? null} isLoading={isLoading} />
        </View>
      </View>

      <RHRTrendChart data={rhrTrendData} isLoading={isTrendLoading} />

      {/* Whoop Section */}
      {whoopConnected ? (
        <View testID="whoop-section">
          <Text className="text-2xl font-bold mt-4">Whoop</Text>

          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <RecoveryCard data={whoopRecovery} isLoading={isWhoopLoading} />
            </View>
          </View>

          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <StrainCard data={whoopStrain} isLoading={isWhoopLoading} />
            </View>
          </View>

          <View className="mt-4">
            <WhoopSleepCard data={whoopSleep} isLoading={isWhoopLoading} />
          </View>

          <View className="mt-4">
            <RecoveryTrendChart data={recoveryTrend} isLoading={isWhoopLoading} />
          </View>
        </View>
      ) : (
        <View testID="whoop-empty-state" className="mt-4">
          <View className="rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="fitness-outline" size={24} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium">Connect Whoop</Text>
                <Text className="text-sm text-muted-foreground">
                  See recovery, strain, and sleep data
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
