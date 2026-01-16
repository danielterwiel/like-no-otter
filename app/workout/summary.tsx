import { useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, type WorkoutExerciseState } from "@/lib/workout";
import {
  saveWorkout,
  calculateTotalVolume,
  getTrainedMuscleGroups,
  getTotalSetsCount,
} from "@/lib/db/queries/workouts";

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    exercises?: string;
    startTime?: string;
    durationSeconds?: string;
  }>();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Parse workout data from params
  const workoutData = useMemo(() => {
    try {
      const exercises: WorkoutExerciseState[] = params.exercises
        ? JSON.parse(params.exercises)
        : [];
      const startTime = params.startTime ? new Date(params.startTime) : new Date();
      const durationSeconds = params.durationSeconds ? parseInt(params.durationSeconds, 10) : 0;

      return {
        exercises,
        startTime,
        durationSeconds,
        totalVolume: calculateTotalVolume(exercises),
        muscleGroups: getTrainedMuscleGroups(exercises),
        totalSets: getTotalSetsCount(exercises),
      };
    } catch (e) {
      console.error("Failed to parse workout data:", e);
      return null;
    }
  }, [params.exercises, params.startTime, params.durationSeconds]);

  const handleSave = useCallback(async () => {
    if (!workoutData) return;

    setIsSaving(true);
    setSaveError(null);

    const endTime = new Date();
    const result = await saveWorkout({
      startTime: workoutData.startTime,
      endTime,
      durationSeconds: workoutData.durationSeconds,
      exercises: workoutData.exercises,
    });

    setIsSaving(false);

    if (result.success) {
      // Navigate back to workouts tab
      router.replace("/(tabs)/workouts");
    } else {
      setSaveError(result.error ?? "Failed to save workout");
    }
  }, [workoutData, router]);

  const handleDiscard = useCallback(() => {
    router.replace("/(tabs)/workouts");
  }, [router]);

  if (Platform.OS === "web") {
    return (
      <View
        testID="workout-summary"
        className="flex-1 items-center justify-center bg-background p-4"
      >
        <Text className="text-muted-foreground">Workout summary requires iOS or Android</Text>
      </View>
    );
  }

  if (!workoutData) {
    return (
      <View testID="workout-summary" className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No workout data available</Text>
        <TouchableOpacity onPress={handleDiscard} className="mt-4 rounded-lg bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k lbs`;
    }
    return `${volume.toLocaleString()} lbs`;
  };

  return (
    <View testID="workout-summary" className="flex-1 bg-background">
      {/* Header */}
      <View className="items-center border-b border-border bg-card px-4 py-6">
        <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
        <Text className="mt-2 text-2xl font-bold text-foreground">Workout Complete!</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Stats Cards */}
        <View className="mb-4 flex-row gap-4">
          <Card testID="duration-card" className="flex-1">
            <CardContent className="items-center py-4">
              <Ionicons name="time-outline" size={28} color="#3b82f6" />
              <Text className="mt-1 text-sm text-muted-foreground">Duration</Text>
              <Text className="text-xl font-bold text-foreground">
                {formatDuration(workoutData.durationSeconds)}
              </Text>
            </CardContent>
          </Card>

          <Card testID="volume-card" className="flex-1">
            <CardContent className="items-center py-4">
              <Ionicons name="barbell-outline" size={28} color="#3b82f6" />
              <Text className="mt-1 text-sm text-muted-foreground">Volume</Text>
              <Text className="text-xl font-bold text-foreground">
                {formatVolume(workoutData.totalVolume)}
              </Text>
            </CardContent>
          </Card>
        </View>

        <View className="mb-4 flex-row gap-4">
          <Card testID="exercises-count-card" className="flex-1">
            <CardContent className="items-center py-4">
              <Ionicons name="list-outline" size={28} color="#3b82f6" />
              <Text className="mt-1 text-sm text-muted-foreground">Exercises</Text>
              <Text className="text-xl font-bold text-foreground">
                {workoutData.exercises.length}
              </Text>
            </CardContent>
          </Card>

          <Card testID="sets-count-card" className="flex-1">
            <CardContent className="items-center py-4">
              <Ionicons name="layers-outline" size={28} color="#3b82f6" />
              <Text className="mt-1 text-sm text-muted-foreground">Sets</Text>
              <Text className="text-xl font-bold text-foreground">{workoutData.totalSets}</Text>
            </CardContent>
          </Card>
        </View>

        {/* Muscle Groups */}
        {workoutData.muscleGroups.length > 0 && (
          <Card testID="muscle-groups-card" className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Muscles Trained</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                {workoutData.muscleGroups.map((muscle) => (
                  <View key={muscle} className="rounded-full bg-primary/10 px-3 py-1">
                    <Text className="text-sm capitalize text-primary">{muscle}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Exercises List */}
        <Card testID="exercises-list-card" className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Exercises Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {workoutData.exercises.map((exerciseState, index) => {
              const workingSets = exerciseState.sets.filter((s) => !s.isWarmup);
              const warmupSets = exerciseState.sets.filter((s) => s.isWarmup);

              return (
                <View
                  key={`${exerciseState.exercise.id}-${index}`}
                  testID={`exercise-summary-${index}`}
                  className={`flex-row items-center border-b border-border px-4 py-3 ${
                    index === workoutData.exercises.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Text className="font-bold text-primary">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">
                      {exerciseState.exercise.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {workingSets.length} set{workingSets.length !== 1 ? "s" : ""}
                      {warmupSets.length > 0 && ` + ${warmupSets.length} warmup`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Error message */}
        {saveError && (
          <View className="mb-4 rounded-lg bg-destructive/10 p-4">
            <Text className="text-center text-destructive">{saveError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="flex-row gap-4 border-t border-border bg-background p-4">
        <TouchableOpacity
          testID="discard-workout-button"
          onPress={handleDiscard}
          disabled={isSaving}
          className="flex-1 flex-row items-center justify-center rounded-lg border border-muted-foreground py-4"
        >
          <Ionicons name="trash-outline" size={24} color="#888" />
          <Text className="ml-2 font-semibold text-muted-foreground">Discard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="save-workout-button"
          onPress={handleSave}
          disabled={isSaving}
          className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-4"
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text className="ml-2 font-semibold text-primary-foreground">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
