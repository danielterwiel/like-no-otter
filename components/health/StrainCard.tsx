import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "./SourceBadge";
import type { WhoopCycleData } from "@/lib/db/queries/whoop";

interface StrainCardProps {
  data: WhoopCycleData | null;
  isLoading: boolean;
}

function getStrainColor(strain: number): string {
  // Strain 0-21 scale, color intensity increases with strain
  if (strain <= 7) return "#22c55e"; // green - light day
  if (strain <= 14) return "#eab308"; // yellow - moderate
  return "#ef4444"; // red - high strain
}

function formatCalories(kilojoules: number | null): string {
  if (kilojoules === null) return "-";
  // Convert kilojoules to calories (1 kJ = 0.239 kcal)
  const calories = Math.round(kilojoules * 0.239);
  return calories >= 1000 ? `${(calories / 1000).toFixed(1)}k` : `${calories}`;
}

export function StrainCard({ data, isLoading }: StrainCardProps) {
  const strain = data?.strain ?? 0;
  const color = getStrainColor(strain);
  // Calculate percentage for gauge (0-21 scale)
  const percentage = Math.min(100, (strain / 21) * 100);

  return (
    <Card testID="whoop-strain-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
          <Ionicons name="fitness-outline" size={20} color="#f97316" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Strain</Text>
        </View>
        {data && <SourceBadge source="Whoop" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View testID="strain-skeleton">
            <Skeleton width="40%" height={36} className="mb-3" />
            <Skeleton width="100%" height={8} className="mb-3 rounded-full" />
            <View className="flex-row gap-4">
              <Skeleton width={70} height={14} />
              <Skeleton width={70} height={14} />
            </View>
          </View>
        ) : data ? (
          <View>
            <Text className="text-4xl font-bold" style={{ color }}>
              {strain.toFixed(1)}
            </Text>
            {/* Gauge visualization */}
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </View>
            <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
              <View className="flex-row items-center gap-1">
                <Ionicons name="flame-outline" size={14} color="#9ca3af" />
                <Text className="text-sm text-muted-foreground">
                  {formatCalories(data.kilojoules)} cal
                </Text>
              </View>
              {data.avgHeartRate !== null && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="heart-outline" size={14} color="#9ca3af" />
                  <Text className="text-sm text-muted-foreground">
                    Avg {Math.round(data.avgHeartRate)} bpm
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">Connect Whoop to see strain</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
