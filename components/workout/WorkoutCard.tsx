import { View, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkoutHistoryItem } from "@/lib/db/queries/workouts";
import { formatDuration } from "@/lib/workout";

interface WorkoutCardProps {
  workout: WorkoutHistoryItem;
  onPress: () => void;
  testID?: string;
}

function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const workoutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (workoutDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (workoutDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k lbs`;
  }
  return `${Math.round(volume)} lbs`;
}

function SourceBadge({ source }: { source: WorkoutHistoryItem["source"] }) {
  if (source === "manual") return null;

  const isStrong = source === "strong";

  return (
    <View
      testID={`workout-source-badge-${source}`}
      className="ml-2 flex-row items-center rounded-full bg-blue-500/10 px-2 py-0.5"
    >
      {isStrong ? (
        <MaterialCommunityIcons name="dumbbell" size={12} color="#2196F3" />
      ) : (
        <Ionicons name="heart" size={12} color="#ef4444" />
      )}
      <Text className="ml-1 text-xs font-medium text-blue-500">
        {isStrong ? "Strong" : "HealthKit"}
      </Text>
    </View>
  );
}

export function WorkoutCard({ workout, onPress, testID }: WorkoutCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} testID={testID}>
      <Card className="mb-3">
        <CardContent className="py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              {/* Date and Source Badge */}
              <View className="flex-row items-center">
                <Text className="text-base font-semibold text-foreground">
                  {formatDate(workout.startTime)}
                </Text>
                <SourceBadge source={workout.source} />
              </View>

              {/* Stats row */}
              <View className="mt-1 flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text className="ml-1 text-sm text-muted-foreground">
                    {formatDuration(workout.durationSeconds)}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="barbell-outline" size={14} color="#888" />
                  <Text className="ml-1 text-sm text-muted-foreground">
                    {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? "s" : ""}
                  </Text>
                </View>

                {workout.totalVolume > 0 && (
                  <View className="flex-row items-center">
                    <Ionicons name="trending-up-outline" size={14} color="#888" />
                    <Text className="ml-1 text-sm text-muted-foreground">
                      {formatVolume(workout.totalVolume)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Muscle groups */}
              {workout.muscleGroups.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {workout.muscleGroups.slice(0, 4).map((muscle) => (
                    <View key={muscle} className="rounded-full bg-muted px-2 py-0.5">
                      <Text className="text-xs capitalize text-muted-foreground">{muscle}</Text>
                    </View>
                  ))}
                  {workout.muscleGroups.length > 4 && (
                    <View className="rounded-full bg-muted px-2 py-0.5">
                      <Text className="text-xs text-muted-foreground">
                        +{workout.muscleGroups.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}
