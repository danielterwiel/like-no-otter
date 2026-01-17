import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "./SourceBadge";
import type { HeartRateData } from "@/lib/health";
import type { WhoopRecoveryData } from "@/lib/db/queries/whoop";

interface RHRCardProps {
  data: HeartRateData | null;
  whoopData?: WhoopRecoveryData | null;
  isLoading: boolean;
}

export function RHRCard({ data, whoopData, isLoading }: RHRCardProps) {
  // Prioritize Whoop data if available
  const useWhoopData =
    whoopData !== null && whoopData !== undefined && whoopData.restingHeartRate !== null;
  const rhr = useWhoopData ? whoopData.restingHeartRate : data?.restingHeartRate;
  const hasData = rhr !== null && rhr !== undefined;

  return (
    <Card testID="rhr-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
          <Ionicons name="heart-outline" size={20} color="#f43f5e" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Resting HR</Text>
        </View>
        {hasData && <SourceBadge source={useWhoopData ? "Whoop" : "Apple Health"} />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View testID="rhr-skeleton">
            <Skeleton width="40%" height={28} className="mb-2" />
            <Skeleton width="30%" height={14} />
          </View>
        ) : hasData ? (
          <View>
            <Text className="text-2xl font-bold">{rhr}</Text>
            <Text className="text-sm text-muted-foreground">BPM</Text>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">No heart rate recorded</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
