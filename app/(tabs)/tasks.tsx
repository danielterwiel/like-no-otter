import { useState, useCallback } from "react";
import { View, TouchableOpacity, Platform, RefreshControl, SectionList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import {
  getTasksBySection,
  type TaskRecord,
  type TaskPriority,
  type TasksBySection,
} from "@/lib/db";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: "#888",
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#ef4444",
};

function formatDueDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dateString + "T00:00:00");
  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    return dueDate.toLocaleDateString("en-US", { weekday: "short" });
  }
  return dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TaskItemProps {
  task: TaskRecord;
}

function TaskItem({ task }: TaskItemProps) {
  const formattedDue = formatDueDate(task.dueDate);
  const isOverdue = formattedDue === "Overdue";

  return (
    <View
      testID={`task-item-${task.id}`}
      className="flex-row items-center border-b border-border bg-card px-4 py-3"
    >
      {/* Priority indicator */}
      <View
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        className="mr-3 h-3 w-3 rounded-full"
      />

      {/* Task content */}
      <View className="flex-1">
        <Text
          className={`font-medium ${task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.title}
        </Text>
        {formattedDue && (
          <Text className={`text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
            {formattedDue}
          </Text>
        )}
      </View>

      {/* Checkbox placeholder - will be implemented in US-019 */}
      <View className="h-6 w-6 rounded-full border-2 border-muted" />
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  count: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  isCollapsible?: boolean;
}

function SectionHeader({ title, count, isCollapsed, onToggle, isCollapsible }: SectionHeaderProps) {
  return (
    <TouchableOpacity
      testID={`section-header-${title.toLowerCase()}`}
      onPress={isCollapsible ? onToggle : undefined}
      disabled={!isCollapsible}
      className="flex-row items-center justify-between bg-muted/50 px-4 py-2"
      activeOpacity={isCollapsible ? 0.7 : 1}
    >
      <View className="flex-row items-center">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <Text className="ml-2 text-sm text-muted-foreground">({count})</Text>
      </View>
      {isCollapsible && (
        <Ionicons name={isCollapsed ? "chevron-down" : "chevron-up"} size={18} color="#888" />
      )}
    </TouchableOpacity>
  );
}

interface SectionEmptyProps {
  section: string;
}

function SectionEmpty({ section }: SectionEmptyProps) {
  let message = "";
  switch (section) {
    case "Today":
      message = "No tasks due today";
      break;
    case "Upcoming":
      message = "No upcoming tasks";
      break;
    case "Done":
      message = "No completed tasks";
      break;
  }

  return (
    <View className="bg-card px-4 py-3">
      <Text className="text-center text-sm text-muted-foreground">{message}</Text>
    </View>
  );
}

interface TaskSectionData {
  title: string;
  data: TaskRecord[];
  isCollapsible?: boolean;
}

export default function TasksScreen() {
  const router = useRouter();
  const [tasksBySection, setTasksBySection] = useState<TasksBySection>({
    today: [],
    upcoming: [],
    done: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(true);

  const loadTasks = useCallback(async () => {
    const sections = await getTasksBySection();
    setTasksBySection(sections);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Reload when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTasks();
  }, [loadTasks]);

  const handleAddTask = useCallback(() => {
    router.push("/task/create");
  }, [router]);

  const toggleDoneSection = useCallback(() => {
    setIsDoneCollapsed((prev) => !prev);
  }, []);

  // Build sections for SectionList
  const sections: TaskSectionData[] = [
    { title: "Today", data: tasksBySection.today },
    { title: "Upcoming", data: tasksBySection.upcoming },
    {
      title: "Done",
      data: isDoneCollapsed ? [] : tasksBySection.done,
      isCollapsible: true,
    },
  ];

  const totalTasks =
    tasksBySection.today.length + tasksBySection.upcoming.length + tasksBySection.done.length;

  if (Platform.OS === "web") {
    return (
      <View testID="screen-tasks" className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Tasks require iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-tasks" className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 pb-4 pt-12">
        <Text className="text-2xl font-bold text-foreground">Tasks</Text>
        <TouchableOpacity
          testID="add-task-button"
          onPress={handleAddTask}
          className="flex-row items-center rounded-full bg-primary px-4 py-2"
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text className="ml-1 font-semibold text-primary-foreground">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading tasks...</Text>
        </View>
      ) : totalTasks === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="items-center p-6">
              <Ionicons name="checkbox-outline" size={48} color="#888" />
              <Text className="mt-4 text-center text-lg font-semibold text-foreground">
                No tasks yet
              </Text>
              <Text className="mt-2 text-center text-muted-foreground">
                Tap the Add button to create your first task
              </Text>
            </CardContent>
          </Card>
        </View>
      ) : (
        <SectionList
          testID="task-list"
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TaskItem task={item} />}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              count={section.title === "Done" ? tasksBySection.done.length : section.data.length}
              isCollapsed={section.title === "Done" ? isDoneCollapsed : undefined}
              onToggle={section.title === "Done" ? toggleDoneSection : undefined}
              isCollapsible={section.isCollapsible}
            />
          )}
          renderSectionFooter={({ section }) => {
            // Show empty state for Today/Upcoming if empty
            // For Done section, show empty only when expanded and empty
            if (section.title === "Done") {
              if (!isDoneCollapsed && tasksBySection.done.length === 0) {
                return <SectionEmpty section={section.title} />;
              }
              return null;
            }
            if (section.data.length === 0) {
              return <SectionEmpty section={section.title} />;
            }
            return null;
          }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}
