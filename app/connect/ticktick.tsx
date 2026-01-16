import { View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";

export default function TickTickConnectScreen() {
  const router = useRouter();

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-connect-ticktick"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">TickTick connection requires iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-connect-ticktick" className="flex-1 bg-background p-6">
      {/* Service Icon */}
      <View className="mb-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Ionicons name="checkbox-outline" size={48} color="#4772FA" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-foreground">Connect TickTick</Text>
      </View>

      {/* Sync Info */}
      <View testID="ticktick-sync-info" className="mb-6 rounded-lg bg-card p-4">
        <Text className="mb-3 text-base font-semibold text-foreground">Bidirectional Sync</Text>
        <Text className="text-sm text-muted-foreground">
          Connecting your TickTick account enables two-way sync:
        </Text>
        <View className="mt-3">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="arrow-down" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Import tasks from TickTick</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="arrow-up" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Sync app tasks to TickTick</Text>
          </View>
        </View>
      </View>

      {/* Connect Button - Placeholder for US-006 OAuth flow */}
      <TouchableOpacity
        testID="ticktick-connect-button"
        className="rounded-lg bg-primary py-4"
        onPress={() => {
          // TODO: Implement OAuth flow in US-006
          router.back();
        }}
      >
        <Text className="text-center text-base font-semibold text-primary-foreground">
          Connect TickTick Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="ticktick-cancel-button"
        className="mt-3 py-4"
        onPress={() => router.back()}
      >
        <Text className="text-center text-base text-muted-foreground">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
