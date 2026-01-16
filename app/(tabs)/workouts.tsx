import { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExerciseCount } from "@/lib/db";

export default function WorkoutsScreen() {
  const router = useRouter();
  const [exerciseCount, setExerciseCount] = useState<number>(0);

  useEffect(() => {
    async function loadCount() {
      const count = await getExerciseCount();
      setExerciseCount(count);
    }
    loadCount();
  }, []);

  return (
    <ScrollView
      testID="screen-workouts"
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
    >
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

      {/* Workout History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="items-center py-8">
            <Ionicons name="fitness-outline" size={48} color="#ccc" />
            <Text className="mt-4 text-center text-muted-foreground">
              No workouts yet.{"\n"}Start your first workout above!
            </Text>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
