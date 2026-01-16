import { View, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { useConnections } from "@/lib/integrations";
import type { ServiceType } from "@/lib/db/schema/connections";

interface ConnectionCardProps {
  service: ServiceType;
  name: string;
  icon: React.ReactNode;
  isConnected: boolean;
  onPress: () => void;
}

function ConnectionCard({ service, name, icon, isConnected, onPress }: ConnectionCardProps) {
  return (
    <TouchableOpacity testID={`connection-card-${service}`} onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3">
        <CardContent className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-muted">
              {icon}
            </View>
            <View>
              <Text className="text-base font-semibold text-foreground">{name}</Text>
              <Text className="text-sm text-muted-foreground">
                {isConnected ? "Connected" : "Not connected"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            {isConnected ? (
              <View
                testID={`connection-status-${service}-connected`}
                className="h-6 w-6 items-center justify-center rounded-full bg-green-500"
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            ) : (
              <View
                testID={`connection-status-${service}-disconnected`}
                className="rounded-full bg-primary px-3 py-1"
              >
                <Text className="text-sm font-medium text-primary-foreground">Connect</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#888" className="ml-2" />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { isConnected, isLoading, refresh } = useConnections();

  // Refresh connection status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleConnectionPress = (service: ServiceType) => {
    router.push(`/connect/${service}`);
  };

  if (Platform.OS === "web") {
    return (
      <View testID="screen-more" className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Connections require iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-more" className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border bg-background px-4 pb-4 pt-12">
        <Text className="text-2xl font-bold text-foreground">More</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Connections Section */}
        <View testID="connections-section" className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-foreground">Connections</Text>

          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <>
              <ConnectionCard
                service="whoop"
                name="Whoop"
                icon={<MaterialCommunityIcons name="watch" size={24} color="#00A2E8" />}
                isConnected={isConnected("whoop")}
                onPress={() => handleConnectionPress("whoop")}
              />

              <ConnectionCard
                service="ticktick"
                name="TickTick"
                icon={<Ionicons name="checkbox-outline" size={24} color="#4772FA" />}
                isConnected={isConnected("ticktick")}
                onPress={() => handleConnectionPress("ticktick")}
              />

              <ConnectionCard
                service="strong"
                name="Strong"
                icon={<MaterialCommunityIcons name="dumbbell" size={24} color="#2196F3" />}
                isConnected={isConnected("strong")}
                onPress={() => handleConnectionPress("strong")}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
