import * as React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "./SourceBadge";
import type { CaloriesData } from "@/lib/health";
import type { WhoopCycleData } from "@/lib/db/queries/whoop";

interface CaloriesCardProps {
  data: CaloriesData | null;
  whoopData?: WhoopCycleData | null;
  isLoading: boolean;
}

function formatCalories(calories: number): string {
  return calories.toLocaleString();
}

export function CaloriesCard({ data, whoopData, isLoading }: CaloriesCardProps) {
  // Prioritize Whoop data if available (convert kilojoules to kcal)
  const useWhoopData =
    whoopData !== null && whoopData !== undefined && whoopData.kilojoules !== null;
  const calories = useWhoopData
    ? Math.round(whoopData.kilojoules! * 0.239006)
    : data?.activeCalories;
  const hasData = calories !== null && calories !== undefined;

  return (
    <Card testID="calories-card">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
          <Ionicons name="flame-outline" size={20} color="#f97316" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Calories</Text>
        </View>
        {hasData && <SourceBadge source={useWhoopData ? "Whoop" : "Apple Health"} />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <View testID="calories-skeleton">
            <Skeleton width="50%" height={28} className="mb-2" />
            <Skeleton width="60%" height={14} />
          </View>
        ) : hasData ? (
          <View>
            <Text className="text-2xl font-bold">{formatCalories(calories)}</Text>
            <Text className="text-sm text-muted-foreground">
              {useWhoopData ? "kcal" : "active kcal"}
            </Text>
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
