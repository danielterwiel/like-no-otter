import { useCallback, useEffect, useState } from "react";
import { View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonWorkoutCard } from "@/components/ui/skeleton";
import { EmptyWorkouts } from "@/components/ui/empty-state";
import { WorkoutCard, MuscleFrequencyChart } from "@/components/workout";
import { getExerciseCount } from "@/lib/db";
import {
  getWorkoutHistory,
  getWorkoutHistoryFiltered,
  getMuscleFrequencyData,
  type WorkoutHistoryItem,
  type MuscleFrequencyData,
  type WorkoutSourceFilter,
} from "@/lib/db/queries/workouts";

const IS_WEB = Platform.OS === "web";

export default function WorkoutsScreen() {
  const router = useRouter();
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [muscleFrequency, setMuscleFrequency] = useState<MuscleFrequencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuscleFrequencyLoading, setIsMuscleFrequencyLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<WorkoutSourceFilter>("all");

  const loadData = useCallback(
    async (currentFilter: WorkoutSourceFilter = filter) => {
      const [count, history, frequency] = await Promise.all([
        getExerciseCount(),
        currentFilter === "all" ? getWorkoutHistory() : getWorkoutHistoryFiltered(currentFilter),
        getMuscleFrequencyData(),
      ]);
      setExerciseCount(count);
      setWorkouts(history);
      setMuscleFrequency(frequency);
      setIsLoading(false);
      setIsMuscleFrequencyLoading(false);
    },
    [filter],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(filter);
    setIsRefreshing(false);
  }, [loadData, filter]);

  const handleFilterChange = useCallback(
    (newFilter: WorkoutSourceFilter) => {
      setFilter(newFilter);
      loadData(newFilter);
    },
    [loadData],
  );

  const handleWorkoutPress = useCallback(
    (workoutId: number) => {
      router.push(`/workout/${workoutId}`);
    },
    [router],
  );

  const renderWorkoutCard = useCallback(
    ({ item, index }: { item: WorkoutHistoryItem; index: number }) => (
      <WorkoutCard
        workout={item}
        onPress={() => handleWorkoutPress(item.id)}
        testID={index === 0 ? "workout-card" : undefined}
      />
    ),
    [handleWorkoutPress],
  );

  const ListHeader = (
    <>
      {/* Start Workout Button */}
      <TouchableOpacity
        testID="start-workout-button"
        onPress={() => router.push("/workout/setup")}
        className="mb-6 flex-row items-center justify-center rounded-xl bg-primary py-4"
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text className="ml-2 text-lg font-semibold text-primary-foreground">Start Workout</Text>
      </TouchableOpacity>

      {/* Muscle Frequency Chart */}
      <View className="mb-4">
        <MuscleFrequencyChart data={muscleFrequency} isLoading={isMuscleFrequencyLoading} />
      </View>

      {/* Exercise Count Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Exercise Library</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center">
            <Ionicons name="barbell-outline" size={24} color="#888" />
            <Text testID="exercise-count" className="ml-2 text-muted-foreground">
              {exerciseCount} exercises available
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Recent Workouts Header with Filter */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">Recent Workouts</Text>
        <View testID="workout-filter-pills" className="flex-row gap-1">
          <TouchableOpacity
            testID="filter-all"
            onPress={() => handleFilterChange("all")}
            className={`rounded-full px-3 py-1 ${filter === "all" ? "bg-primary" : "bg-muted"}`}
          >
            <Text
              className={`text-xs font-medium ${filter === "all" ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="filter-manual"
            onPress={() => handleFilterChange("manual")}
            className={`rounded-full px-3 py-1 ${filter === "manual" ? "bg-primary" : "bg-muted"}`}
          >
            <Text
              className={`text-xs font-medium ${filter === "manual" ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              Manual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="filter-imported"
            onPress={() => handleFilterChange("imported")}
            className={`rounded-full px-3 py-1 ${filter === "imported" ? "bg-primary" : "bg-muted"}`}
          >
            <Text
              className={`text-xs font-medium ${filter === "imported" ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              Imported
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const LoadingSkeleton = (
    <View testID="workout-history-loading">
      <SkeletonWorkoutCard />
      <SkeletonWorkoutCard />
      <SkeletonWorkoutCard />
    </View>
  );

  const EmptyStateComponent = <EmptyWorkouts testID="workout-empty-state" />;

  return (
    <View testID="screen-workouts" className="flex-1 bg-background">
      <FlashList
        testID="workout-history"
        data={workouts}
        renderItem={renderWorkoutCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={isLoading ? LoadingSkeleton : EmptyStateComponent}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          !IS_WEB ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
