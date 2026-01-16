import { View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";

export default function WhoopConnectScreen() {
  const router = useRouter();

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-connect-whoop"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">Whoop connection requires iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-connect-whoop" className="flex-1 bg-background p-6">
      {/* Service Icon */}
      <View className="mb-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MaterialCommunityIcons name="watch" size={48} color="#00A2E8" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-foreground">Connect Whoop</Text>
      </View>

      {/* Data Access Info */}
      <View testID="whoop-data-info" className="mb-6 rounded-lg bg-card p-4">
        <Text className="mb-3 text-base font-semibold text-foreground">Data Access</Text>
        <Text className="text-sm text-muted-foreground">
          Connecting your Whoop account will allow access to:
        </Text>
        <View className="mt-3">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="heart" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Recovery scores</Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <Ionicons name="bed" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Sleep data</Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <Ionicons name="flash" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Strain scores</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="barbell" size={16} color="#22c55e" />
            <Text className="ml-2 text-sm text-foreground">Workout data</Text>
          </View>
        </View>
      </View>

      {/* Connect Button - Placeholder for US-003 OAuth flow */}
      <TouchableOpacity
        testID="whoop-connect-button"
        className="rounded-lg bg-primary py-4"
        onPress={() => {
          // TODO: Implement OAuth flow in US-003
          router.back();
        }}
      >
        <Text className="text-center text-base font-semibold text-primary-foreground">
          Connect Whoop Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="whoop-cancel-button"
        className="mt-3 py-4"
        onPress={() => router.back()}
      >
        <Text className="text-center text-base text-muted-foreground">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
