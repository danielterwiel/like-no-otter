import { useEffect, useCallback } from "react";
import { View, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMachine } from "@xstate/react";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetRow, SetInput } from "@/components/workout";
import { workoutMachine, formatDuration, type WorkoutExerciseState } from "@/lib/workout";
import type { ExerciseRecord } from "@/lib/db";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exercises?: string }>();
  const [state, send] = useMachine(workoutMachine);

  // Parse exercises from params and start workout
  useEffect(() => {
    if (params.exercises && state.matches("idle")) {
      try {
        const exercises: ExerciseRecord[] = JSON.parse(params.exercises);
        if (exercises.length > 0) {
          send({ type: "START", exercises });
        }
      } catch (e) {
        console.error("Failed to parse exercises:", e);
        router.back();
      }
    }
  }, [params.exercises, state, send, router]);

  const handleFinish = useCallback(() => {
    send({ type: "FINISH" });
    // TODO: Navigate to summary screen (US-013)
    router.back();
  }, [send, router]);

  const handleCancel = useCallback(() => {
    send({ type: "CANCEL" });
    router.back();
  }, [send, router]);

  const currentExercise: WorkoutExerciseState | undefined =
    state.context.exercises[state.context.currentExerciseIndex];

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-active-workout"
        className="flex-1 items-center justify-center bg-background p-4"
      >
        <Text className="text-muted-foreground">Active workout requires iOS or Android</Text>
      </View>
    );
  }

  if (state.matches("idle")) {
    return (
      <View
        testID="screen-active-workout"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">Loading workout...</Text>
      </View>
    );
  }

  return (
    <View testID="screen-active-workout" className="flex-1 bg-background">
      {/* Timer Header */}
      <View className="items-center border-b border-border bg-card px-4 py-6">
        <Text testID="workout-timer" className="text-5xl font-bold tracking-wider text-foreground">
          {formatDuration(state.context.elapsedSeconds)}
        </Text>
        <Text className="mt-2 text-muted-foreground">
          Exercise {state.context.currentExerciseIndex + 1} of {state.context.exercises.length}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Current Exercise Card */}
        {currentExercise && (
          <Card testID="current-exercise-card" className="mb-4">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {currentExercise.exercise.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="items-center">
                <Text className="text-muted-foreground">
                  {currentExercise.exercise.primaryMuscles.join(", ")}
                </Text>
                <Text className="mt-2 text-sm text-muted-foreground">
                  Category: {currentExercise.exercise.category}
                </Text>
              </View>

              {/* Previous workout comparison placeholder */}
              <View
                testID="previous-workout-comparison"
                className="mt-4 rounded-lg border border-border bg-muted/50 p-3"
              >
                <Text className="text-center text-sm text-muted-foreground">
                  Previous workout data will appear here
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Set Logging Section */}
        {currentExercise && (
          <Card testID="set-logging-card" className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Log Sets</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Previous sets list */}
              {currentExercise.sets.length > 0 && (
                <View testID="sets-list" className="mb-4">
                  {currentExercise.sets.map((set, index) => (
                    <SetRow
                      key={`set-${set.setNumber}-${index}`}
                      testID={`set-row-${index}`}
                      set={set}
                      onDelete={() =>
                        send({
                          type: "DELETE_SET",
                          exerciseIndex: state.context.currentExerciseIndex,
                          setIndex: index,
                        })
                      }
                    />
                  ))}
                </View>
              )}

              {/* Set input form */}
              <View className="p-4 pt-0">
                <SetInput
                  testID="set-input"
                  onAddSet={(weight, reps, isWarmup) =>
                    send({
                      type: "ADD_SET",
                      exerciseIndex: state.context.currentExerciseIndex,
                      weight,
                      reps,
                      isWarmup,
                    })
                  }
                />
              </View>
            </CardContent>
          </Card>
        )}

        {/* Exercise Navigation */}
        <View className="mb-4 flex-row justify-center gap-4">
          <TouchableOpacity
            testID="previous-exercise-button"
            onPress={() => send({ type: "PREVIOUS_EXERCISE" })}
            disabled={state.context.currentExerciseIndex === 0}
            className={`flex-row items-center rounded-lg px-6 py-3 ${
              state.context.currentExerciseIndex === 0 ? "bg-muted" : "bg-secondary"
            }`}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={state.context.currentExerciseIndex === 0 ? "#888" : "#fff"}
            />
            <Text
              className={`ml-1 font-medium ${
                state.context.currentExerciseIndex === 0
                  ? "text-muted-foreground"
                  : "text-secondary-foreground"
              }`}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="next-exercise-button"
            onPress={() => send({ type: "NEXT_EXERCISE" })}
            disabled={state.context.currentExerciseIndex >= state.context.exercises.length - 1}
            className={`flex-row items-center rounded-lg px-6 py-3 ${
              state.context.currentExerciseIndex >= state.context.exercises.length - 1
                ? "bg-muted"
                : "bg-secondary"
            }`}
          >
            <Text
              className={`mr-1 font-medium ${
                state.context.currentExerciseIndex >= state.context.exercises.length - 1
                  ? "text-muted-foreground"
                  : "text-secondary-foreground"
              }`}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                state.context.currentExerciseIndex >= state.context.exercises.length - 1
                  ? "#888"
                  : "#fff"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Exercise Queue Overview */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Workout Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {state.context.exercises.map((ex, index) => (
              <TouchableOpacity
                key={ex.exercise.id}
                testID={`exercise-queue-item-${index}`}
                onPress={() => send({ type: "GO_TO_EXERCISE", index })}
                className={`flex-row items-center border-b border-border px-4 py-3 ${
                  index === state.context.currentExerciseIndex ? "bg-primary/10" : "bg-background"
                }`}
              >
                <View
                  className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
                    index === state.context.currentExerciseIndex ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      index === state.context.currentExerciseIndex
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      index === state.context.currentExerciseIndex
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {ex.exercise.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {ex.sets.length} sets completed
                  </Text>
                </View>
                {index === state.context.currentExerciseIndex && (
                  <Ionicons name="arrow-forward-circle" size={24} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="flex-row gap-4 border-t border-border bg-background p-4">
        <TouchableOpacity
          testID="cancel-workout-button"
          onPress={handleCancel}
          className="flex-1 flex-row items-center justify-center rounded-lg border border-destructive py-4"
        >
          <Ionicons name="close" size={24} color="#ef4444" />
          <Text className="ml-2 font-semibold text-destructive">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="finish-workout-button"
          onPress={handleFinish}
          className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-4"
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text className="ml-2 font-semibold text-primary-foreground">Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
