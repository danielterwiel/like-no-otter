import { View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";

export default function StrongConnectScreen() {
  const router = useRouter();

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-connect-strong"
        className="flex-1 items-center justify-center bg-background"
      >
        <Text className="text-muted-foreground">Strong import requires iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-connect-strong" className="flex-1 bg-background p-6">
      {/* Service Icon */}
      <View className="mb-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MaterialCommunityIcons name="dumbbell" size={48} color="#2196F3" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-foreground">Import from Strong</Text>
      </View>

      {/* Import Instructions */}
      <View testID="strong-import-info" className="mb-6 rounded-lg bg-card p-4">
        <Text className="mb-3 text-base font-semibold text-foreground">CSV Import</Text>
        <Text className="text-sm text-muted-foreground">
          Import your workout history from the Strong app:
        </Text>
        <View className="mt-3">
          <View className="mb-2 flex-row items-start">
            <Text className="mr-2 text-sm font-semibold text-foreground">1.</Text>
            <Text className="flex-1 text-sm text-foreground">
              Open Strong app and go to Settings
            </Text>
          </View>
          <View className="mb-2 flex-row items-start">
            <Text className="mr-2 text-sm font-semibold text-foreground">2.</Text>
            <Text className="flex-1 text-sm text-foreground">
              Select &quot;Export Data&quot; and choose CSV format
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="mr-2 text-sm font-semibold text-foreground">3.</Text>
            <Text className="flex-1 text-sm text-foreground">Save the file and import it here</Text>
          </View>
        </View>
      </View>

      {/* Data Info */}
      <View className="mb-6 rounded-lg bg-muted/50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="information-circle" size={20} color="#888" />
          <Text className="ml-2 flex-1 text-sm text-muted-foreground">
            Your workout data stays on your device. Strong does not have an API, so CSV import is
            the only way to transfer data.
          </Text>
        </View>
      </View>

      {/* Import Button - Placeholder for US-009 CSV import flow */}
      <TouchableOpacity
        testID="strong-import-button"
        className="rounded-lg bg-primary py-4"
        onPress={() => {
          // TODO: Implement CSV import in US-009
          router.back();
        }}
      >
        <View className="flex-row items-center justify-center">
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text className="ml-2 text-base font-semibold text-primary-foreground">
            Select CSV File
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        testID="strong-cancel-button"
        className="mt-3 py-4"
        onPress={() => router.back()}
      >
        <Text className="text-center text-base text-muted-foreground">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
