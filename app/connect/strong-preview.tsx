import { useState, useMemo, useCallback } from "react";
import { View, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedStrongWorkout } from "@/lib/integrations/strong";
import { importStrongWorkouts, type StrongImportWorkout } from "@/lib/db/queries/workouts";
import { updateConnection } from "@/lib/integrations/connection-manager";

type ScreenState = "preview" | "importing" | "success" | "error";

export default function StrongPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workouts?: string;
    totalWorkouts?: string;
    totalExercises?: string;
    dateStart?: string;
    dateEnd?: string;
  }>();

  const [screenState, setScreenState] = useState<ScreenState>("preview");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(
    null,
  );
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());

  // Parse workout data from params
  const parsedData = useMemo(() => {
    try {
      if (!params.workouts) return null;

      const workouts: ParsedStrongWorkout[] = JSON.parse(params.workouts).map(
        (w: { date: string } & Omit<ParsedStrongWorkout, "date">) => ({
          ...w,
          date: new Date(w.date),
        }),
      );

      // Initialize all workouts as selected
      const initialSelected = new Set(workouts.map((w) => w.id));
      if (selectedWorkouts.size === 0) {
        setSelectedWorkouts(initialSelected);
      }

      return {
        workouts,
        totalWorkouts: parseInt(params.totalWorkouts || "0", 10),
        totalExercises: parseInt(params.totalExercises || "0", 10),
        dateStart: params.dateStart ? new Date(params.dateStart) : null,
        dateEnd: params.dateEnd ? new Date(params.dateEnd) : null,
      };
    } catch (e) {
      console.error("Failed to parse workout data:", e);
      return null;
    }
  }, [
    params.workouts,
    params.totalWorkouts,
    params.totalExercises,
    params.dateStart,
    params.dateEnd,
  ]);

  const toggleWorkoutSelection = useCallback((workoutId: string) => {
    setSelectedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!parsedData) return;
    setSelectedWorkouts(new Set(parsedData.workouts.map((w) => w.id)));
  }, [parsedData]);

  const deselectAll = useCallback(() => {
    setSelectedWorkouts(new Set());
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsedData) return;

    const workoutsToImport = parsedData.workouts.filter((w) => selectedWorkouts.has(w.id));
    if (workoutsToImport.length === 0) {
      setError("No workouts selected for import");
      return;
    }

    setScreenState("importing");
    setError(null);

    try {
      // Convert ParsedStrongWorkout to StrongImportWorkout
      const importWorkouts: StrongImportWorkout[] = workoutsToImport.map((w) => ({
        date: w.date,
        name: w.name,
        durationSeconds: w.durationSeconds,
        exercises: w.exercises.map((e) => ({
          name: e.name,
          sets: e.sets.map((s) => ({
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            isWarmup: s.isWarmup,
          })),
        })),
        notes: w.notes,
      }));

      const result = await importStrongWorkouts(importWorkouts);

      setImportResult({
        imported: result.importedCount,
        skipped: result.skippedCount,
      });

      if (result.success) {
        // Update connection status
        await updateConnection({ service: "strong", status: "connected" });
        setScreenState("success");
      } else {
        setScreenState("error");
        setError(result.error || "Import failed");
      }
    } catch (err) {
      console.error("Import error:", err);
      setScreenState("error");
      setError(err instanceof Error ? err.message : "Failed to import workouts");
    }
  }, [parsedData, selectedWorkouts]);

  const handleDone = useCallback(() => {
    router.replace("/(tabs)/workouts");
  }, [router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-strong-preview"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">Strong import requires iOS or Android</Text>
      </View>
    );
  }

  if (!parsedData) {
    return (
      <View
        testID="screen-strong-preview"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">No workout data to preview</Text>
        <TouchableOpacity onPress={handleCancel} className="mt-4 rounded-lg bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (): string => {
    if (!parsedData.dateStart || !parsedData.dateEnd) return "Unknown";
    if (parsedData.dateStart.getTime() === parsedData.dateEnd.getTime()) {
      return formatDate(parsedData.dateStart);
    }
    return `${formatDate(parsedData.dateStart)} - ${formatDate(parsedData.dateEnd)}`;
  };

  // Success screen
  if (screenState === "success") {
    return (
      <View testID="screen-strong-preview" className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
          </View>
          <Text className="mb-2 text-2xl font-bold text-foreground">Import Complete!</Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Successfully imported {importResult?.imported || 0} workout
            {(importResult?.imported || 0) !== 1 ? "s" : ""} from Strong.
            {importResult?.skipped ? ` ${importResult.skipped} skipped.` : ""}
          </Text>
          <TouchableOpacity
            testID="strong-import-done-button"
            className="rounded-lg bg-primary px-8 py-4"
            onPress={handleDone}
          >
            <Text className="font-semibold text-primary-foreground">View Workouts</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Importing screen
  if (screenState === "importing") {
    return (
      <View testID="screen-strong-preview" className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" className="mb-4" />
          <Text className="mb-2 text-xl font-semibold text-foreground">Importing Workouts...</Text>
          <Text className="text-muted-foreground">
            {selectedWorkouts.size} workout{selectedWorkouts.size !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    );
  }

  const selectedCount = selectedWorkouts.size;
  const allSelected = selectedCount === parsedData.workouts.length;

  return (
    <View testID="screen-strong-preview" className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border bg-card px-4 py-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MaterialCommunityIcons name="dumbbell" size={28} color="#2196F3" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Import Preview</Text>
            <Text className="text-sm text-muted-foreground">{formatDateRange()}</Text>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="flex-row gap-3 px-4 py-4">
        <Card testID="workout-count-card" className="flex-1">
          <CardContent className="items-center py-3">
            <Text className="text-2xl font-bold text-foreground">{parsedData.totalWorkouts}</Text>
            <Text className="text-xs text-muted-foreground">Workouts</Text>
          </CardContent>
        </Card>
        <Card testID="exercise-count-card" className="flex-1">
          <CardContent className="items-center py-3">
            <Text className="text-2xl font-bold text-foreground">{parsedData.totalExercises}</Text>
            <Text className="text-xs text-muted-foreground">Exercises</Text>
          </CardContent>
        </Card>
        <Card testID="selected-count-card" className="flex-1">
          <CardContent className="items-center py-3">
            <Text className="text-2xl font-bold text-primary">{selectedCount}</Text>
            <Text className="text-xs text-muted-foreground">Selected</Text>
          </CardContent>
        </Card>
      </View>

      {/* Selection Actions */}
      <View className="flex-row justify-end gap-2 px-4 pb-2">
        <TouchableOpacity
          testID="select-all-button"
          onPress={allSelected ? deselectAll : selectAll}
          className="rounded-lg px-3 py-1"
        >
          <Text className="text-sm text-primary">
            {allSelected ? "Deselect All" : "Select All"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout List */}
      <ScrollView className="flex-1 px-4">
        <Card testID="workouts-list-card" className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Workouts to Import</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {parsedData.workouts.map((workout, index) => {
              const isSelected = selectedWorkouts.has(workout.id);
              const exerciseCount = workout.exercises.length;
              const setCount = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);

              return (
                <TouchableOpacity
                  key={workout.id}
                  testID={`workout-preview-${index}`}
                  onPress={() => toggleWorkoutSelection(workout.id)}
                  className={`flex-row items-center border-b border-border px-4 py-3 ${
                    index === parsedData.workouts.length - 1 ? "border-b-0" : ""
                  } ${isSelected ? "bg-primary/5" : ""}`}
                >
                  {/* Checkbox */}
                  <View
                    className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>

                  {/* Workout Info */}
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">{workout.name}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {formatDate(workout.date)} - {exerciseCount} exercise
                      {exerciseCount !== 1 ? "s" : ""}, {setCount} set{setCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Error Display */}
      {error && (
        <View className="mx-4 mb-4 rounded-lg bg-destructive/10 p-4">
          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text className="ml-2 flex-1 text-sm text-destructive">{error}</Text>
          </View>
        </View>
      )}

      {/* Bottom Action Buttons */}
      <View className="flex-row gap-4 border-t border-border bg-background p-4">
        <TouchableOpacity
          testID="strong-preview-cancel-button"
          onPress={handleCancel}
          className="flex-1 flex-row items-center justify-center rounded-lg border border-muted-foreground py-4"
        >
          <Text className="font-semibold text-muted-foreground">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="strong-import-confirm-button"
          onPress={handleImport}
          disabled={selectedCount === 0}
          className={`flex-1 flex-row items-center justify-center rounded-lg py-4 ${
            selectedCount === 0 ? "bg-muted" : "bg-primary"
          }`}
        >
          <Ionicons
            name="download-outline"
            size={20}
            color={selectedCount === 0 ? "#888" : "#fff"}
          />
          <Text
            className={`ml-2 font-semibold ${
              selectedCount === 0 ? "text-muted-foreground" : "text-primary-foreground"
            }`}
          >
            Import ({selectedCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
