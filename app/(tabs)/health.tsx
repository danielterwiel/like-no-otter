import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function HealthScreen() {
  return (
    <View testID="screen-health" className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-primary">Health</Text>
      <Text className="mt-4 text-muted-foreground">Health metrics and trends</Text>
    </View>
  );
}
