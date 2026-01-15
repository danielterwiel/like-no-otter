import { useEffect, useState } from "react";
import { View, TextInput, FlatList, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { searchExercises, getExerciseCount, type ExerciseRecord } from "@/lib/db";

export default function WorkoutsScreen() {
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExerciseRecord[]>([]);

  useEffect(() => {
    async function loadCount() {
      const count = await getExerciseCount();
      setExerciseCount(count);
    }
    loadCount();
  }, []);

  useEffect(() => {
    async function runSearch() {
      if (searchQuery.length > 0) {
        const results = await searchExercises(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
    runSearch();
  }, [searchQuery]);

  return (
    <View testID="screen-workouts" className="flex-1 bg-background p-4">
      <Text className="text-xl font-bold text-primary">Workouts</Text>
      <Text testID="exercise-count" className="mt-2 text-muted-foreground">
        {exerciseCount} exercises available
      </Text>

      <TextInput
        testID="exercise-search-input"
        className="mt-4 rounded-lg border border-input bg-background px-4 py-3 text-foreground"
        placeholder="Search exercises..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {searchResults.length > 0 && (
        <FlatList
          testID="exercise-search-results"
          className="mt-4"
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View testID={`exercise-item-${item.id}`} className="border-b border-border py-3">
              <Text className="font-medium text-foreground">{item.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {item.category} | {item.primaryMuscles.join(", ")}
              </Text>
            </View>
          )}
        />
      )}

      {searchQuery.length > 0 && searchResults.length === 0 && Platform.OS !== "web" && (
        <Text className="mt-4 text-muted-foreground">No exercises found</Text>
      )}
    </View>
  );
}
