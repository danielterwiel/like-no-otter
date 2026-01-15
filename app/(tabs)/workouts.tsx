import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function WorkoutsScreen() {
  return (
    <View testID="screen-workouts" className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-primary">Workouts</Text>
      <Text className="mt-4 text-muted-foreground">Workout history and tracking</Text>
    </View>
  );
}
