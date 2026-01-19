import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "./SourceBadge";
import type { SleepData } from "@/lib/health";
import type { WhoopSleepData } from "@/lib/db/queries/whoop";

interface SleepCardProps {
  data: SleepData | null;
  whoopData?: WhoopSleepData | null;
  isLoading: boolean;
}

function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

function SleepStageBar({ label: _label, duration, total, color }: SleepStageBarProps) {
  const percentage = duration && total > 0 ? (duration / total) * 100 : 0;

  return (
    <View className="flex-1">
      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
      <View className="mt-1.5 flex-row items-center gap-1">
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text className="text-xs font-medium">{formatDuration(duration)}</Text>
      </View>
    </View>
  );
}

export function SleepCard({ data, whoopData, isLoading }: SleepCardProps) {
  // Prioritize Whoop data if available
  const useWhoopData = whoopData !== null && whoopData !== undefined;
  const hasData = useWhoopData || data !== null;

  // Calculate total sleep time from Whoop stages
  const totalSleep = whoopData
    ? (whoopData.remDuration ?? 0) + (whoopData.deepDuration ?? 0) + (whoopData.lightDuration ?? 0)
    : 0;

  return (
    <Card testID="sleep-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
          <Ionicons
            name={useWhoopData ? "moon-outline" : "bed-outline"}
            size={20}
            color="#6366f1"
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Sleep</Text>
        </View>
        {hasData && <SourceBadge source={useWhoopData ? "Whoop" : "Health"} />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View testID="sleep-skeleton">
            <Skeleton width="50%" height={28} className="mb-2" />
            <Skeleton width="80%" height={14} />
          </View>
        ) : useWhoopData ? (
          <View>
            <Text className="text-4xl font-bold text-indigo-500">
              {formatTotalSleep(whoopData.qualityDuration ?? totalSleep)}
            </Text>
            {/* Sleep stages breakdown */}
            <View className="mt-3 flex-row gap-3">
              <SleepStageBar
                label="REM"
                duration={whoopData.remDuration}
                total={totalSleep}
                color={SLEEP_COLORS.rem}
              />
              <SleepStageBar
                label="Deep"
                duration={whoopData.deepDuration}
                total={totalSleep}
                color={SLEEP_COLORS.deep}
              />
              <SleepStageBar
                label="Light"
                duration={whoopData.lightDuration}
                total={totalSleep}
                color={SLEEP_COLORS.light}
              />
              <SleepStageBar
                label="Awake"
                duration={whoopData.awakeDuration}
                total={totalSleep + (whoopData.awakeDuration ?? 0)}
                color={SLEEP_COLORS.awake}
              />
            </View>
          </View>
        ) : data ? (
          <View>
            <Text className="text-2xl font-bold">{formatHours(data.totalHours)}</Text>
            <Text className="text-sm text-muted-foreground">
              {formatTime(data.startTime)} - {formatTime(data.endTime)}
            </Text>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">No sleep recorded</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
