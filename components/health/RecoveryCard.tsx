import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import type { WhoopRecoveryData } from "@/lib/db/queries/whoop";

interface RecoveryCardProps {
  data: WhoopRecoveryData | null;
  isLoading: boolean;
}

function getRecoveryColor(score: number): string {
  if (score <= 33) return "#ef4444"; // red-500
  if (score <= 66) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
}

function getRecoveryBgColor(score: number): string {
  if (score <= 33) return "bg-red-500/10";
  if (score <= 66) return "bg-yellow-500/10";
  return "bg-green-500/10";
}

export function RecoveryCard({ data, isLoading }: RecoveryCardProps) {
  const score = data?.recoveryScore ?? 0;
  const color = getRecoveryColor(score);
  const bgColorClass = getRecoveryBgColor(score);

  return (
    <Card testID="whoop-recovery-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className={`h-10 w-10 items-center justify-center rounded-full ${bgColorClass}`}>
          <Ionicons name="battery-charging-outline" size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Recovery</Text>
        </View>
        <View className="rounded-full bg-primary/10 px-2 py-0.5">
          <Text className="text-xs font-medium text-primary">Whoop</Text>
        </View>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View testID="recovery-skeleton">
            <Skeleton width="50%" height={36} className="mb-3" />
            <View className="flex-row gap-4">
              <Skeleton width={60} height={14} />
              <Skeleton width={60} height={14} />
              <Skeleton width={60} height={14} />
            </View>
          </View>
        ) : data ? (
          <View>
            <Text className="text-4xl font-bold" style={{ color }}>
              {score}%
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
              {data.hrvRmssd !== null && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="pulse-outline" size={14} color="#9ca3af" />
                  <Text className="text-sm text-muted-foreground">
                    HRV {Math.round(data.hrvRmssd)}ms
                  </Text>
                </View>
              )}
              {data.restingHeartRate !== null && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="heart-outline" size={14} color="#9ca3af" />
                  <Text className="text-sm text-muted-foreground">
                    RHR {Math.round(data.restingHeartRate)}
                  </Text>
                </View>
              )}
              {data.spo2 !== null && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="water-outline" size={14} color="#9ca3af" />
                  <Text className="text-sm text-muted-foreground">SpO2 {data.spo2}%</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">Connect Whoop to see recovery</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
