import * as React from "react";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { HeartRateData } from "@/lib/health";

interface RHRCardProps {
  data: HeartRateData | null;
  isLoading: boolean;
}

export function RHRCard({ data, isLoading }: RHRCardProps) {
  return (
    <Card testID="rhr-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
          <Ionicons name="heart-outline" size={20} color="#f43f5e" />
        </View>
        <Text className="text-base font-medium text-muted-foreground">Resting HR</Text>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View className="items-center justify-center py-2">
            <ActivityIndicator size="small" />
          </View>
        ) : data ? (
          <View>
            <Text className="text-2xl font-bold">{data.restingHeartRate}</Text>
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
