import * as React from "react";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { StepsData } from "@/lib/health";

interface StepsCardProps {
  data: StepsData | null;
  isLoading: boolean;
}

function formatSteps(count: number): string {
  return count.toLocaleString();
}

export function StepsCard({ data, isLoading }: StepsCardProps) {
  return (
    <Card testID="steps-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
          <Ionicons name="footsteps-outline" size={20} color="#10b981" />
        </View>
        <Text className="text-base font-medium text-muted-foreground">Steps</Text>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View className="items-center justify-center py-2">
            <ActivityIndicator size="small" />
          </View>
        ) : data ? (
          <View>
            <Text className="text-2xl font-bold">{formatSteps(data.count)}</Text>
            <Text className="text-sm text-muted-foreground">steps today</Text>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">No steps recorded</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
