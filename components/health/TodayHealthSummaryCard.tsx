import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthData } from "@/lib/health";
import type { WhoopRecoveryData, WhoopCycleData, WhoopSleepData } from "@/lib/db/queries/whoop";

interface TodayHealthSummaryCardProps {
  healthData: HealthData | null;
  whoopRecovery?: WhoopRecoveryData | null;
  whoopStrain?: WhoopCycleData | null;
  whoopSleep?: WhoopSleepData | null;
  isLoading: boolean;
}

function formatTotalSleep(
  healthSleep: { totalHours: number } | null,
  whoopSleep: WhoopSleepData | null
): string {
  if (whoopSleep) {
    const totalMs = (whoopSleep.remDuration ?? 0) + (whoopSleep.deepDuration ?? 0) + (whoopSleep.lightDuration ?? 0);
    const hours = totalMs / 3600000;
    return `${hours.toFixed(1)}h`;
  }
  if (healthSleep) {
    const h = Math.floor(healthSleep.totalHours);
    const m = Math.round((healthSleep.totalHours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  return "-";
}

function formatSteps(count: number | null): string {
  if (count === null) return "-";
  return count.toLocaleString();
}

function formatCalories(
  healthCalories: { activeCalories: number } | null,
  whoopStrain: WhoopCycleData | null
): string {
  // Prioritize Whoop data
  if (whoopStrain?.kilojoules !== null && whoopStrain?.kilojoules !== undefined) {
    return Math.round(whoopStrain.kilojoules * 0.239006).toLocaleString();
  }
  if (healthCalories?.activeCalories !== null && healthCalories?.activeCalories !== undefined) {
    return healthCalories.activeCalories.toLocaleString();
  }
  return "-";
}

function formatRHR(
  healthHR: { restingHeartRate: number } | null,
  whoopRecovery: WhoopRecoveryData | null
): string {
  // Prioritize Whoop data
  if (whoopRecovery?.restingHeartRate !== null && whoopRecovery?.restingHeartRate !== undefined) {
    return whoopRecovery.restingHeartRate.toString();
  }
  if (healthHR?.restingHeartRate !== null && healthHR?.restingHeartRate !== undefined) {
    return healthHR.restingHeartRate.toString();
  }
  return "-";
}

export function TodayHealthSummaryCard({
  healthData,
  whoopRecovery,
  whoopStrain,
  whoopSleep,
  isLoading,
}: TodayHealthSummaryCardProps) {
  return (
    <Card testID="today-health-summary">
      <CardContent className="py-4">
        {isLoading ? (
          <View className="flex-row justify-between">
            <Skeleton width="20%" height={48} />
            <Skeleton width="20%" height={48} />
            <Skeleton width="20%" height={48} />
            <Skeleton width="20%" height={48} />
          </View>
        ) : (
          <View className="flex-row justify-between">
            {/* Sleep */}
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 mb-1">
                <Ionicons name="bed-outline" size={16} color="#6366f1" />
              </View>
              <Text className="text-lg font-bold">
                {formatTotalSleep(healthData?.sleep ?? null, whoopSleep ?? null)}
              </Text>
              <Text className="text-xs text-muted-foreground">Sleep</Text>
            </View>

            {/* Steps */}
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 mb-1">
                <Ionicons name="footsteps-outline" size={16} color="#10b981" />
              </View>
              <Text className="text-lg font-bold">
                {formatSteps(healthData?.steps?.count ?? null)}
              </Text>
              <Text className="text-xs text-muted-foreground">Steps</Text>
            </View>

            {/* Calories */}
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 mb-1">
                <Ionicons name="flame-outline" size={16} color="#f97316" />
              </View>
              <Text className="text-lg font-bold">
                {formatCalories(healthData?.calories ?? null, whoopStrain ?? null)}
              </Text>
              <Text className="text-xs text-muted-foreground">Calories</Text>
            </View>

            {/* Resting HR */}
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 mb-1">
                <Ionicons name="heart-outline" size={16} color="#f43f5e" />
              </View>
              <Text className="text-lg font-bold">
                {formatRHR(healthData?.heartRate ?? null, whoopRecovery ?? null)}
              </Text>
              <Text className="text-xs text-muted-foreground">RHR</Text>
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
