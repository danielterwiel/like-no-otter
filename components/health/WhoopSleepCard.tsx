import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import type { WhoopSleepData } from "@/lib/db/queries/whoop";

interface WhoopSleepCardProps {
  data: WhoopSleepData | null;
  isLoading: boolean;
}

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) return "-";
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTotalSleep(milliseconds: number | null): string {
  if (milliseconds === null) return "-";
  const hours = milliseconds / 3600000;
  return `${hours.toFixed(1)}h`;
}

// Sleep stage colors matching common sleep tracker conventions
const SLEEP_COLORS = {
  rem: "#8b5cf6", // violet
  deep: "#3b82f6", // blue
  light: "#06b6d4", // cyan
  awake: "#f97316", // orange
};

interface SleepStageBarProps {
  label: string;
  duration: number | null;
  total: number;
  color: string;
}

function SleepStageBar({ label, duration, total, color }: SleepStageBarProps) {
  const percentage = duration && total > 0 ? (duration / total) * 100 : 0;

  return (
    <View className="flex-1">
      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
      <Text className="mt-1 text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs font-medium">{formatDuration(duration)}</Text>
    </View>
  );
}

export function WhoopSleepCard({ data, isLoading }: WhoopSleepCardProps) {
  // Calculate total sleep time from stages
  const totalSleep = data
    ? (data.remDuration ?? 0) + (data.deepDuration ?? 0) + (data.lightDuration ?? 0)
    : 0;

  return (
    <Card testID="whoop-sleep-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
          <Ionicons name="moon-outline" size={20} color="#6366f1" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Sleep</Text>
        </View>
        <View className="rounded-full bg-primary/10 px-2 py-0.5">
          <Text className="text-xs font-medium text-primary">Whoop</Text>
        </View>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View testID="whoop-sleep-skeleton">
            <Skeleton width="40%" height={36} className="mb-3" />
            <View className="flex-row gap-2">
              <Skeleton width="25%" height={24} />
              <Skeleton width="25%" height={24} />
              <Skeleton width="25%" height={24} />
              <Skeleton width="25%" height={24} />
            </View>
          </View>
        ) : data ? (
          <View>
            <Text className="text-4xl font-bold text-indigo-500">
              {formatTotalSleep(data.qualityDuration ?? totalSleep)}
            </Text>
            {/* Sleep stages breakdown */}
            <View className="mt-3 flex-row gap-3">
              <SleepStageBar
                label="REM"
                duration={data.remDuration}
                total={totalSleep}
                color={SLEEP_COLORS.rem}
              />
              <SleepStageBar
                label="Deep"
                duration={data.deepDuration}
                total={totalSleep}
                color={SLEEP_COLORS.deep}
              />
              <SleepStageBar
                label="Light"
                duration={data.lightDuration}
                total={totalSleep}
                color={SLEEP_COLORS.light}
              />
              <SleepStageBar
                label="Awake"
                duration={data.awakeDuration}
                total={totalSleep + (data.awakeDuration ?? 0)}
                color={SLEEP_COLORS.awake}
              />
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">Connect Whoop to see sleep data</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
