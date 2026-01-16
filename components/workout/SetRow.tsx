import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import type { WorkoutSet } from "@/lib/workout";

interface SetRowProps {
  set: WorkoutSet;
  onDelete: () => void;
  testID?: string;
}

export function SetRow({ set, onDelete, testID }: SetRowProps) {
  return (
    <View
      testID={testID}
      className="flex-row items-center border-b border-border bg-background px-4 py-3"
    >
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-muted">
        <Text className="font-bold text-muted-foreground">{set.setNumber}</Text>
      </View>

      {set.isWarmup && (
        <View className="mr-2 rounded bg-orange-100 px-2 py-0.5 dark:bg-orange-900">
          <Text className="text-xs font-medium text-orange-600 dark:text-orange-400">Warmup</Text>
        </View>
      )}

      <View className="flex-1 flex-row items-center">
        <View className="mr-4 flex-row items-center">
          <Ionicons name="barbell-outline" size={16} color="#888" />
          <Text className="ml-1 text-foreground">
            {set.weight !== null ? `${set.weight} lbs` : "—"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="repeat-outline" size={16} color="#888" />
          <Text className="ml-1 text-foreground">
            {set.reps !== null ? `${set.reps} reps` : "—"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        testID={`${testID}-delete`}
        onPress={onDelete}
        className="ml-2 rounded-full p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}
