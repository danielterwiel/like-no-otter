import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  SectionList,
  type SectionListData,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { getAllExercises, searchExercises, type ExerciseRecord } from "@/lib/db";
import type { ExerciseCategory } from "@/constants/exercises";

interface ExerciseSection {
  title: string;
  data: ExerciseRecord[];
}

const CATEGORY_ORDER: ExerciseCategory[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
];

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  cable: "Cable",
  bodyweight: "Bodyweight",
};

export default function WorkoutSetupScreen() {
  const router = useRouter();
  const [allExercises, setAllExercises] = useState<ExerciseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExerciseRecord[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<ExerciseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all exercises on mount
  useEffect(() => {
    async function loadExercises() {
      const exercises = await getAllExercises();
      setAllExercises(exercises);
      setIsLoading(false);
    }
    loadExercises();
  }, []);

  // Search with debounce effect
  useEffect(() => {
    async function runSearch() {
      if (searchQuery.length > 0) {
        const results = await searchExercises(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
    const timeoutId = setTimeout(runSearch, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Group exercises by category for section list
  const exerciseSections = useMemo((): ExerciseSection[] => {
    const exercises = searchQuery.length > 0 ? searchResults : allExercises;
    const grouped = new Map<ExerciseCategory, ExerciseRecord[]>();

    for (const exercise of exercises) {
      const existing = grouped.get(exercise.category) || [];
      grouped.set(exercise.category, [...existing, exercise]);
    }

    return CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => ({
      title: CATEGORY_LABELS[cat],
      data: grouped.get(cat) || [],
    }));
  }, [allExercises, searchResults, searchQuery]);

  const addExercise = useCallback((exercise: ExerciseRecord) => {
    setSelectedExercises((prev) => {
      // Don't add duplicates
      if (prev.some((e) => e.id === exercise.id)) {
        return prev;
      }
      return [...prev, exercise];
    });
  }, []);

  const removeExercise = useCallback((exerciseId: number) => {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  }, []);

  const moveExercise = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedExercises((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, []);

  const handleStartWorkout = useCallback(() => {
    if (selectedExercises.length === 0) return;
    // Navigate to active workout with selected exercises
    router.push({
      pathname: "/workout/active",
      params: { exercises: JSON.stringify(selectedExercises) },
    });
  }, [selectedExercises, router]);

  const renderExerciseItem = useCallback(
    ({ item }: { item: ExerciseRecord }) => {
      const isSelected = selectedExercises.some((e) => e.id === item.id);
      return (
        <TouchableOpacity
          testID={`exercise-item-${item.id}`}
          onPress={() => addExercise(item)}
          className={`flex-row items-center justify-between border-b border-border px-4 py-3 ${
            isSelected ? "bg-muted/50" : "bg-background"
          }`}
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <Text className="font-medium text-foreground">{item.name}</Text>
            <Text className="text-sm text-muted-foreground">{item.primaryMuscles.join(", ")}</Text>
          </View>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          ) : (
            <Ionicons name="add-circle-outline" size={24} color="#888" />
          )}
        </TouchableOpacity>
      );
    },
    [selectedExercises, addExercise],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<ExerciseRecord, ExerciseSection> }) => (
      <View className="bg-muted/80 px-4 py-2">
        <Text className="text-sm font-semibold uppercase text-muted-foreground">
          {section.title}
        </Text>
      </View>
    ),
    [],
  );

  const renderQueueItem = useCallback(
    ({ item, index }: { item: ExerciseRecord; index: number }) => (
      <View
        testID={`queue-item-${item.id}`}
        className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3"
      >
        <View className="mr-3 flex-row items-center">
          {index > 0 && (
            <TouchableOpacity onPress={() => moveExercise(index, index - 1)} className="mr-2 p-1">
              <Ionicons name="chevron-up" size={20} color="#888" />
            </TouchableOpacity>
          )}
          {index < selectedExercises.length - 1 && (
            <TouchableOpacity onPress={() => moveExercise(index, index + 1)} className="mr-2 p-1">
              <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-medium text-foreground">{item.name}</Text>
          <Text className="text-sm text-muted-foreground">{item.primaryMuscles.join(", ")}</Text>
        </View>
        <TouchableOpacity
          testID={`remove-exercise-${item.id}`}
          onPress={() => removeExercise(item.id)}
          className="p-2"
        >
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
    ),
    [selectedExercises, moveExercise, removeExercise],
  );

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-workout-setup"
        className="flex-1 items-center justify-center bg-background p-4"
      >
        <Text className="text-muted-foreground">Workout setup requires iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-workout-setup" className="flex-1 bg-background">
      {/* Selected Exercises Queue */}
      {selectedExercises.length > 0 && (
        <Card testID="workout-queue" className="mx-4 mt-4">
          <CardContent className="p-0">
            <View className="flex-row items-center justify-between border-b border-border bg-primary/10 px-4 py-2">
              <Text className="font-semibold text-foreground">
                Workout Queue ({selectedExercises.length})
              </Text>
            </View>
            <FlashList
              data={selectedExercises}
              renderItem={renderQueueItem}
              keyExtractor={(item) => `queue-${item.id}`}
            />
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <View className="p-4">
        <View className="flex-row items-center rounded-lg border border-input bg-background px-4">
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            testID="exercise-search-input"
            className="ml-2 flex-1 py-3 text-foreground"
            placeholder="Search exercises..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Exercise List */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Loading exercises...</Text>
          </View>
        ) : (
          <SectionList
            testID="exercise-list"
            sections={exerciseSections}
            renderItem={renderExerciseItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => String(item.id)}
            stickySectionHeadersEnabled
          />
        )}
      </View>

      {/* Start Workout Button */}
      <View className="border-t border-border bg-background p-4">
        <TouchableOpacity
          testID="start-workout-button"
          onPress={handleStartWorkout}
          disabled={selectedExercises.length === 0}
          className={`flex-row items-center justify-center rounded-lg py-4 ${
            selectedExercises.length > 0 ? "bg-primary" : "bg-muted"
          }`}
        >
          <Ionicons name="play" size={24} color={selectedExercises.length > 0 ? "#fff" : "#888"} />
          <Text
            className={`ml-2 text-lg font-semibold ${
              selectedExercises.length > 0 ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Start Workout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
