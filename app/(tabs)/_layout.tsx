import { Tabs } from "expo-router";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Today: "📅",
    Health: "❤️",
    Workouts: "💪",
    Tasks: "✓",
  };
  return (
    <View className="items-center justify-center">
      <Text className={`text-lg ${focused ? "opacity-100" : "opacity-50"}`}>{icons[name]}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "hsl(240 5.9% 10%)",
        tabBarInactiveTintColor: "hsl(240 3.8% 46.1%)",
        tabBarStyle: {
          backgroundColor: "hsl(0 0% 100%)",
          borderTopColor: "hsl(240 5.9% 90%)",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => <TabIcon name="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ focused }) => <TabIcon name="Health" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ focused }) => <TabIcon name="Workouts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ focused }) => <TabIcon name="Tasks" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
