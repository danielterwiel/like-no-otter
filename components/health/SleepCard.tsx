import * as React from "react";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { SleepData } from "@/lib/health";

interface SleepCardProps {
  data: SleepData | null;
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

export function SleepCard({ data, isLoading }: SleepCardProps) {
  return (
    <Card testID="sleep-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
          <Ionicons name="bed-outline" size={20} color="#6366f1" />
        </View>
        <Text className="text-base font-medium text-muted-foreground">Sleep</Text>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View className="items-center justify-center py-2">
            <ActivityIndicator size="small" />
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
