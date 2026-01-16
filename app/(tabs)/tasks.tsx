import { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, Platform, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { getAllTasks, type TaskRecord, type TaskPriority } from "@/lib/db";

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

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    const taskList = await getAllTasks();
    setTasks(taskList);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Load on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const renderTaskItem = useCallback(({ item }: { item: TaskRecord }) => {
    return <TaskItem task={item} />;
  }, []);

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
      ) : tasks.length === 0 ? (
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
        <FlashList
          testID="task-list"
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );
}
