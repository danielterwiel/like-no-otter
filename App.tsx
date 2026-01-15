import "./global.css";

import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { Text } from "@/components/ui/text";

export default function App() {
  return (
    <View testID="app-ready" className="flex-1 items-center justify-center bg-background">
      <Text testID="app-title" className="text-xl font-bold text-primary">
        Like No Otter - Health & Workout Tracker
      </Text>
      <StatusBar style="auto" />
      <PortalHost />
    </View>
  );
}
