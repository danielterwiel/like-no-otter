import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function TodayScreen() {
  return (
    <View testID="app-ready" className="flex-1 items-center justify-center bg-background">
      <Text testID="app-title" className="text-xl font-bold text-primary">
        Like No Otter - Health & Workout Tracker
      </Text>
      <Text testID="screen-today" className="mt-4 text-muted-foreground">
        Today Dashboard
      </Text>
    </View>
  );
}
