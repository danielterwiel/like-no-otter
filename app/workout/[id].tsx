import { useEffect, useState } from "react";
import { View, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkoutById, type WorkoutDetailItem } from "@/lib/db/queries/workouts";
import { formatDuration } from "@/lib/workout";

const IS_WEB = Platform.OS === "web";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return `${Math.round(volume)}`;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWorkout() {
      if (!id || IS_WEB) {
        setIsLoading(false);
        return;
      }

      const data = await getWorkoutById(Number(id));
      setWorkout(data);
      setIsLoading(false);
    }

    loadWorkout();
  }, [id]);

  if (IS_WEB) {
    return (
      <View
        testID="workout-detail"
        className="flex-1 items-center justify-center bg-background p-4"
      >
        <Text className="text-center text-muted-foreground">
          Workout details are only available on iOS.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View testID="workout-detail" className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View
        testID="workout-detail"
        className="flex-1 items-center justify-center bg-background p-4"
      >
        <Ionicons name="alert-circle-outline" size={48} color="#888" />
        <Text className="mt-4 text-center text-muted-foreground">Workout not found</Text>
      </View>
    );
  }

  // Calculate totals
  const totalSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => !s.isWarmup).length,
    0,
  );
  const muscleGroups = [...new Set(workout.exercises.flatMap((ex) => ex.primaryMuscles))];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Workout Details",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        testID="workout-detail"
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground">
            {formatDate(workout.startTime)}
          </Text>
          <Text className="text-muted-foreground">
            {formatTime(workout.startTime)} - {formatTime(workout.endTime)}
          </Text>
        </View>

        {/* Stats */}
        <View className="mb-4 flex-row gap-3">
          <Card className="flex-1">
            <CardContent className="items-center py-3">
              <Ionicons name="time-outline" size={24} color="#888" />
              <Text className="mt-1 text-lg font-semibold">
                {formatDuration(workout.durationSeconds)}
              </Text>
              <Text className="text-xs text-muted-foreground">Duration</Text>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="items-center py-3">
              <Ionicons name="trending-up-outline" size={24} color="#888" />
              <Text className="mt-1 text-lg font-semibold">
                {formatVolume(workout.totalVolume)}
              </Text>
              <Text className="text-xs text-muted-foreground">Volume (lbs)</Text>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="items-center py-3">
              <Ionicons name="layers-outline" size={24} color="#888" />
              <Text className="mt-1 text-lg font-semibold">{totalSets}</Text>
              <Text className="text-xs text-muted-foreground">Sets</Text>
            </CardContent>
          </Card>
        </View>

        {/* Muscles Trained */}
        {muscleGroups.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Muscles Trained</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                {muscleGroups.map((muscle) => (
                  <View key={muscle} className="rounded-full bg-primary/10 px-3 py-1">
                    <Text className="text-sm capitalize text-primary">{muscle}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            {workout.exercises.map((exercise, index) => {
              const workingSets = exercise.sets.filter((s) => !s.isWarmup);
              const warmupSets = exercise.sets.filter((s) => s.isWarmup);

              return (
                <View
                  key={`${exercise.exerciseId}-${index}`}
                  className={
                    index < workout.exercises.length - 1 ? "mb-4 border-b border-border pb-4" : ""
                  }
                >
                  <Text className="font-semibold text-foreground">{exercise.name}</Text>
                  <Text className="mb-2 text-xs capitalize text-muted-foreground">
                    {exercise.category} • {exercise.primaryMuscles.join(", ")}
                  </Text>

                  {/* Sets */}
                  {exercise.sets.map((set) => (
                    <View key={set.id} className="ml-2 flex-row items-center py-1">
                      <View
                        className={`mr-2 h-5 w-5 items-center justify-center rounded-full ${set.isWarmup ? "bg-muted" : "bg-primary/20"}`}
                      >
                        <Text
                          className={`text-xs ${set.isWarmup ? "text-muted-foreground" : "text-primary"}`}
                        >
                          {set.setNumber}
                        </Text>
                      </View>
                      {set.isWarmup && (
                        <Text className="mr-2 text-xs italic text-muted-foreground">(warm)</Text>
                      )}
                      <Text className="text-sm text-foreground">
                        {set.weight ?? 0} lbs x {set.reps ?? 0} reps
                      </Text>
                    </View>
                  ))}

                  <Text className="ml-2 mt-1 text-xs text-muted-foreground">
                    {workingSets.length} working set{workingSets.length !== 1 ? "s" : ""}
                    {warmupSets.length > 0 && ` + ${warmupSets.length} warmup`}
                  </Text>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Notes */}
        {workout.notes && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground">{workout.notes}</Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </>
  );
}
