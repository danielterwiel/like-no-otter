import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function TasksScreen() {
  return (
    <View testID="screen-tasks" className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-primary">Tasks</Text>
      <Text className="mt-4 text-muted-foreground">Task management</Text>
    </View>
  );
}
