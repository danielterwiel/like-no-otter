import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { useHealthKit } from "@/providers/HealthKitProvider";

export function HealthKitDenied() {
  const { openSettings, requestAuthorization } = useHealthKit();

  return (
    <View
      testID="healthkit-denied"
      className="flex-1 items-center justify-center bg-background px-6"
    >
      <View className="w-20 h-20 rounded-full bg-destructive/10 items-center justify-center mb-4">
        <Ionicons name="heart-dislike-outline" size={40} color="#ef4444" />
      </View>

      <Text className="text-xl font-bold text-center mb-2">Health Access Denied</Text>

      <Text className="text-muted-foreground text-center mb-6">
        Like No Otter needs access to your health data to show metrics and trends. You can enable
        access in Settings.
      </Text>

      <TouchableOpacity
        testID="healthkit-settings-button"
        onPress={openSettings}
        className="bg-primary py-3 px-6 rounded-xl flex-row items-center"
        activeOpacity={0.8}
      >
        <Ionicons name="settings-outline" size={20} color="white" style={{ marginRight: 8 }} />
        <Text className="text-white font-semibold">Open Health Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="healthkit-retry-button"
        onPress={requestAuthorization}
        className="mt-4 py-3 px-6"
        activeOpacity={0.6}
      >
        <Text className="text-primary">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
