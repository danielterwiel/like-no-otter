import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useHealthKit } from "@/providers/HealthKitProvider";
import { HealthKitDenied } from "@/components/HealthKitDenied";

export default function HealthScreen() {
  const { authStatus, isAvailable } = useHealthKit();

  // Show denied state if on iOS and authorization was denied
  if (isAvailable && authStatus === "denied") {
    return <HealthKitDenied />;
  }

  // Show placeholder for authorized or non-iOS users
  return (
    <View testID="screen-health" className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-primary">Health</Text>
      <Text className="mt-4 text-muted-foreground">
        {isAvailable ? "Health metrics and trends" : "HealthKit is only available on iOS devices"}
      </Text>
    </View>
  );
}
