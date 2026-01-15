import { View, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { useHealthKit } from "@/providers/HealthKitProvider";

interface HealthDataItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const HEALTH_DATA_ITEMS: HealthDataItem[] = [
  {
    icon: "bed-outline",
    title: "Sleep",
    description: "Track your sleep duration and quality",
  },
  {
    icon: "footsteps-outline",
    title: "Steps",
    description: "Monitor your daily step count",
  },
  {
    icon: "flame-outline",
    title: "Calories",
    description: "View your active energy burned",
  },
  {
    icon: "heart-outline",
    title: "Heart Rate",
    description: "Track your resting heart rate trends",
  },
];

export function HealthKitOnboarding() {
  const { completeOnboarding, skipOnboarding, isAvailable } = useHealthKit();

  // On non-iOS platforms, this shouldn't be shown, but handle it just in case
  if (!isAvailable && Platform.OS !== "ios") {
    return null;
  }

  return (
    <View testID="healthkit-onboarding" className="flex-1 bg-background px-6 pt-16 pb-8">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Ionicons name="fitness-outline" size={40} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-center">Connect Your Health Data</Text>
          <Text className="text-muted-foreground text-center mt-2">
            Like No Otter can read your health data to display personalized metrics and trends.
          </Text>
        </View>

        {/* Health data items */}
        <View className="space-y-4">
          {HEALTH_DATA_ITEMS.map((item) => (
            <View
              key={item.title}
              className="flex-row items-center p-4 bg-card rounded-xl border border-border"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                <Ionicons name={item.icon} size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold">{item.title}</Text>
                <Text className="text-sm text-muted-foreground">{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Privacy note */}
        <View className="mt-6 p-4 bg-muted/50 rounded-xl">
          <View className="flex-row items-start">
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#6b7280"
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <Text className="flex-1 text-sm text-muted-foreground">
              Your health data stays on your device and is never shared. You can change permissions
              anytime in Settings.
            </Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View className="space-y-3 mt-auto">
        <TouchableOpacity
          testID="healthkit-connect-button"
          onPress={completeOnboarding}
          className="bg-primary py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">Connect Apple Health</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="healthkit-skip-button"
          onPress={skipOnboarding}
          className="py-4 items-center"
          activeOpacity={0.6}
        >
          <Text className="text-muted-foreground">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
