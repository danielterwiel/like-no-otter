import { useCallback, useEffect, useState } from "react";
import { View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutCard } from "@/components/workout";
import { getExerciseCount } from "@/lib/db";
import { getWorkoutHistory, type WorkoutHistoryItem } from "@/lib/db/queries/workouts";

const IS_WEB = Platform.OS === "web";

export default function WorkoutsScreen() {
  const router = useRouter();
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [count, history] = await Promise.all([getExerciseCount(), getWorkoutHistory()]);
    setExerciseCount(count);
    setWorkouts(history);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

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

      {/* Recent Workouts Header */}
      <Text className="mb-3 text-lg font-semibold text-foreground">Recent Workouts</Text>
    </>
  );

  const EmptyState = (
    <Card>
      <CardContent>
        <View className="items-center py-8">
          <Ionicons name="fitness-outline" size={48} color="#ccc" />
          <Text className="mt-4 text-center text-muted-foreground">
            No workouts yet.{"\n"}Start your first workout above!
          </Text>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View testID="screen-workouts" className="flex-1 bg-background">
      <FlashList
        testID="workout-history"
        data={workouts}
        renderItem={renderWorkoutCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!isLoading ? EmptyState : null}
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
