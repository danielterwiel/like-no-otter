import * as React from "react";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { CaloriesData } from "@/lib/health";

interface CaloriesCardProps {
  data: CaloriesData | null;
  isLoading: boolean;
}

function formatCalories(calories: number): string {
  return calories.toLocaleString();
}

export function CaloriesCard({ data, isLoading }: CaloriesCardProps) {
  return (
    <Card testID="calories-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
          <Ionicons name="flame-outline" size={20} color="#f97316" />
        </View>
        <Text className="text-base font-medium text-muted-foreground">Calories</Text>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View className="items-center justify-center py-2">
            <ActivityIndicator size="small" />
          </View>
        ) : data ? (
          <View>
            <Text className="text-2xl font-bold">{formatCalories(data.activeCalories)}</Text>
            <Text className="text-sm text-muted-foreground">active kcal</Text>
          </View>
        ) : (
          <View>
            <Text className="text-lg text-muted-foreground">No data</Text>
            <Text className="text-sm text-muted-foreground">No calories recorded</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
