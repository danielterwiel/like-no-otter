import { useState, useMemo, useCallback } from "react";
import {
  View,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { UnmappedExercise, MappingMatch } from "@/lib/integrations/strong";
import { saveExerciseMapping } from "@/lib/integrations/strong";

type MappingDecision = {
  exerciseId: number | null;
  exerciseName: string | null;
  isSkipped: boolean;
  isNewExercise: boolean;
};

export default function StrongMappingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    unmapped?: string;
    workoutsJson?: string;
    totalWorkouts?: string;
    totalExercises?: string;
    dateStart?: string;
    dateEnd?: string;
    autoMapped?: string;
  }>();

  const [decisions, setDecisions] = useState<Map<string, MappingDecision>>(new Map());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Parse unmapped exercises from params
  const unmappedExercises: UnmappedExercise[] = useMemo(() => {
    try {
      if (!params.unmapped) return [];
      return JSON.parse(params.unmapped);
    } catch (e) {
      console.error("Failed to parse unmapped exercises:", e);
      return [];
    }
  }, [params.unmapped]);

  const toggleExpand = useCallback((strongName: string) => {
    setExpandedExercise((prev) => (prev === strongName ? null : strongName));
  }, []);

  const handleSelectSuggestion = useCallback((strongName: string, suggestion: MappingMatch) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.set(strongName, {
        exerciseId: suggestion.exercise.id,
        exerciseName: suggestion.exercise.name,
        isSkipped: false,
        isNewExercise: false,
      });
      return next;
    });
    setExpandedExercise(null);
  }, []);

  const handleSkip = useCallback((strongName: string) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.set(strongName, {
        exerciseId: null,
        exerciseName: null,
        isSkipped: true,
        isNewExercise: false,
      });
      return next;
    });
    setExpandedExercise(null);
  }, []);

  const handleCreateNew = useCallback(
    (strongName: string) => {
      const customName = customNames.get(strongName) || strongName;
      setDecisions((prev) => {
        const next = new Map(prev);
        next.set(strongName, {
          exerciseId: null,
          exerciseName: customName,
          isSkipped: false,
          isNewExercise: true,
        });
        return next;
      });
      setExpandedExercise(null);
    },
    [customNames],
  );

  const handleCustomNameChange = useCallback((strongName: string, name: string) => {
    setCustomNames((prev) => {
      const next = new Map(prev);
      next.set(strongName, name);
      return next;
    });
  }, []);

  const handleClearDecision = useCallback((strongName: string) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.delete(strongName);
      return next;
    });
  }, []);

  const handleSaveAndContinue = useCallback(async () => {
    setIsSaving(true);

    try {
      // Save all decisions to database cache
      for (const exercise of unmappedExercises) {
        const decision = decisions.get(exercise.strongName);

        if (decision) {
          await saveExerciseMapping(exercise.strongName, decision.exerciseId, decision.isSkipped);
        }
      }

      // Navigate to preview screen with updated data
      router.replace({
        pathname: "/connect/strong-preview",
        params: {
          workouts: params.workoutsJson,
          totalWorkouts: params.totalWorkouts,
          totalExercises: params.totalExercises,
          dateStart: params.dateStart,
          dateEnd: params.dateEnd,
          mappingComplete: "true",
        },
      });
    } catch (error) {
      console.error("Failed to save mappings:", error);
    } finally {
      setIsSaving(false);
    }
  }, [unmappedExercises, decisions, params, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-strong-mapping"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">Strong mapping requires iOS or Android</Text>
      </View>
    );
  }

  const decidedCount = decisions.size;
  const totalCount = unmappedExercises.length;
  const allDecided = decidedCount === totalCount;

  const formatSimilarity = (similarity: number): string => {
    return `${Math.round(similarity * 100)}%`;
  };

  return (
    <View testID="screen-strong-mapping" className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border bg-card px-4 py-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Ionicons name="git-compare-outline" size={28} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Map Exercises</Text>
            <Text className="text-sm text-muted-foreground">
              {decidedCount} of {totalCount} exercises mapped
            </Text>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      <View className="mx-4 mt-4 rounded-lg bg-blue-50 p-3">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text className="ml-2 flex-1 text-sm text-blue-700">
            Some exercises couldn&apos;t be automatically matched. Choose from suggestions, create
            new exercises, or skip to exclude them from import.
          </Text>
        </View>
      </View>

      {/* Exercise List */}
      <ScrollView className="flex-1 px-4 py-4">
        {unmappedExercises.map((exercise, index) => {
          const decision = decisions.get(exercise.strongName);
          const isExpanded = expandedExercise === exercise.strongName;
          const customName = customNames.get(exercise.strongName) || exercise.strongName;

          return (
            <Card key={exercise.strongName} testID={`mapping-exercise-${index}`} className="mb-3">
              <TouchableOpacity onPress={() => toggleExpand(exercise.strongName)}>
                <CardHeader className="pb-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{exercise.strongName}</Text>
                      {decision && (
                        <View className="mt-1 flex-row items-center">
                          {decision.isSkipped ? (
                            <View className="flex-row items-center rounded-full bg-muted px-2 py-0.5">
                              <Ionicons name="remove-circle" size={12} color="#888" />
                              <Text className="ml-1 text-xs text-muted-foreground">Skipped</Text>
                            </View>
                          ) : decision.isNewExercise ? (
                            <View className="flex-row items-center rounded-full bg-green-100 px-2 py-0.5">
                              <Ionicons name="add-circle" size={12} color="#22c55e" />
                              <Text className="ml-1 text-xs text-green-700">
                                Create: {decision.exerciseName}
                              </Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center rounded-full bg-primary/10 px-2 py-0.5">
                              <Ionicons name="checkmark-circle" size={12} color="#6366f1" />
                              <Text className="ml-1 text-xs text-primary">
                                Mapped to: {decision.exerciseName}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#888"
                    />
                  </View>
                </CardHeader>
              </TouchableOpacity>

              {isExpanded && (
                <CardContent className="pt-0">
                  {/* Clear decision button */}
                  {decision && (
                    <TouchableOpacity
                      onPress={() => handleClearDecision(exercise.strongName)}
                      className="mb-3 flex-row items-center rounded-lg border border-muted-foreground/30 px-3 py-2"
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#888" />
                      <Text className="ml-2 text-sm text-muted-foreground">Clear selection</Text>
                    </TouchableOpacity>
                  )}

                  {/* Suggestions */}
                  {exercise.suggestions.length > 0 && (
                    <>
                      <Text className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        Suggestions
                      </Text>
                      {exercise.suggestions.map((suggestion, suggIndex) => (
                        <TouchableOpacity
                          key={suggestion.exercise.id}
                          testID={`suggestion-${index}-${suggIndex}`}
                          onPress={() => handleSelectSuggestion(exercise.strongName, suggestion)}
                          className={`mb-2 flex-row items-center justify-between rounded-lg border px-3 py-2 ${
                            decision?.exerciseId === suggestion.exercise.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <Text className="flex-1 text-foreground">{suggestion.exercise.name}</Text>
                          <View className="ml-2 rounded-full bg-muted px-2 py-0.5">
                            <Text className="text-xs text-muted-foreground">
                              {formatSimilarity(suggestion.similarity)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Create new exercise option */}
                  <Text className="mb-2 mt-3 text-xs font-medium uppercase text-muted-foreground">
                    Create New Exercise
                  </Text>
                  <View className="mb-2 rounded-lg border border-border p-3">
                    <TextInput
                      testID={`custom-name-input-${index}`}
                      value={customName}
                      onChangeText={(text) => handleCustomNameChange(exercise.strongName, text)}
                      placeholder="Exercise name"
                      className="mb-2 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                    />
                    <TouchableOpacity
                      testID={`create-new-${index}`}
                      onPress={() => handleCreateNew(exercise.strongName)}
                      className={`flex-row items-center justify-center rounded-lg px-3 py-2 ${
                        decision?.isNewExercise ? "bg-green-500" : "bg-green-100"
                      }`}
                    >
                      <Ionicons
                        name="add-circle"
                        size={18}
                        color={decision?.isNewExercise ? "#fff" : "#22c55e"}
                      />
                      <Text
                        className={`ml-2 font-medium ${
                          decision?.isNewExercise ? "text-white" : "text-green-700"
                        }`}
                      >
                        Create Exercise
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Skip option */}
                  <TouchableOpacity
                    testID={`skip-${index}`}
                    onPress={() => handleSkip(exercise.strongName)}
                    className={`mt-2 flex-row items-center justify-center rounded-lg border px-3 py-2 ${
                      decision?.isSkipped
                        ? "border-muted-foreground bg-muted"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={18}
                      color={decision?.isSkipped ? "#fff" : "#888"}
                    />
                    <Text
                      className={`ml-2 ${
                        decision?.isSkipped ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      Skip this exercise
                    </Text>
                  </TouchableOpacity>
                </CardContent>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="flex-row gap-4 border-t border-border bg-background p-4">
        <TouchableOpacity
          testID="strong-mapping-cancel-button"
          onPress={handleCancel}
          className="flex-1 flex-row items-center justify-center rounded-lg border border-muted-foreground py-4"
        >
          <Text className="font-semibold text-muted-foreground">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="strong-mapping-continue-button"
          onPress={handleSaveAndContinue}
          disabled={!allDecided || isSaving}
          className={`flex-1 flex-row items-center justify-center rounded-lg py-4 ${
            !allDecided || isSaving ? "bg-muted" : "bg-primary"
          }`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={!allDecided ? "#888" : "#fff"} />
              <Text
                className={`ml-2 font-semibold ${
                  !allDecided ? "text-muted-foreground" : "text-primary-foreground"
                }`}
              >
                Continue ({decidedCount}/{totalCount})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
