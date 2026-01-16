import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, IconName> = {
  Today: "calendar-outline",
  Health: "heart-outline",
  Workouts: "barbell-outline",
  Tasks: "checkbox-outline",
  More: "ellipsis-horizontal",
};

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Ionicons name={TAB_ICONS[name]} size={24} color={color} />;
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
          tabBarIcon: ({ color }) => <TabIcon name="Today" color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color }) => <TabIcon name="Health" color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) => <TabIcon name="Workouts" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabIcon name="Tasks" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <TabIcon name="More" color={color} />,
        }}
      />
    </Tabs>
  );
}
