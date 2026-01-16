import * as React from "react";
import { View, ScrollView, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { useHealthKit } from "@/providers/HealthKitProvider";
import { HealthKitDenied } from "@/components/HealthKitDenied";
import { SleepCard, StepsCard, CaloriesCard, RHRCard } from "@/components/health";
import { fetchTodayHealthData, type HealthData } from "@/lib/health";

export default function HealthScreen() {
  const { authStatus, isAvailable } = useHealthKit();
  const [healthData, setHealthData] = React.useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadHealthData() {
      // Only fetch on iOS when authorized
      if (Platform.OS === "ios" && authStatus === "authorized") {
        setIsLoading(true);
        const data = await fetchTodayHealthData();
        setHealthData(data);
        setIsLoading(false);
      } else {
        // On web/non-iOS, set empty state immediately
        setIsLoading(false);
        setHealthData({ sleep: null, steps: null, calories: null, heartRate: null });
      }
    }
    loadHealthData();
  }, [authStatus]);

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
    </ScrollView>
  );
}
