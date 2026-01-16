import { useState, useCallback } from "react";
import { View, TouchableOpacity, Platform, RefreshControl, SectionList } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { SkeletonTaskItem } from "@/components/ui/skeleton";
import { EmptyTasks } from "@/components/ui/empty-state";
import { SwipeableTaskItem, type TaskSyncStatus } from "@/components/tasks";
import {
  getTasksBySection,
  toggleTaskCompletion,
  type TaskRecord,
  type TasksBySection,
} from "@/lib/db";
import { useConnections } from "@/lib/integrations/connection-manager";
import { syncTickTickTasks, triggerDebouncedSync } from "@/lib/integrations/ticktick/sync";

export type TaskFilterType = "all" | "ticktick" | "local";

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
  const { isConnected } = useConnections();
  const [tasksBySection, setTasksBySection] = useState<TasksBySection>({
    today: [],
    upcoming: [],
    done: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(true);
  const [filter, setFilter] = useState<TaskFilterType>("all");
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<number>>(new Set());
  const [errorTaskIds, setErrorTaskIds] = useState<Set<number>>(new Set());

  const isTickTickConnected = isConnected("ticktick");

  const loadTasks = useCallback(async () => {
    const sections = await getTasksBySection();
    setTasksBySection(sections);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Filter tasks based on selected filter
  const filterTasks = useCallback(
    (tasks: TaskRecord[]): TaskRecord[] => {
      if (filter === "all") return tasks;
      if (filter === "ticktick") return tasks.filter((t) => t.ticktickId !== null);
      if (filter === "local") return tasks.filter((t) => t.ticktickId === null);
      return tasks;
    },
    [filter],
  );

  // Get sync status for a task
  const getSyncStatus = useCallback(
    (task: TaskRecord): TaskSyncStatus => {
      if (pendingTaskIds.has(task.id)) return "pending";
      if (errorTaskIds.has(task.id)) return "error";
      if (task.ticktickId) return "synced";
      return "local";
    },
    [pendingTaskIds, errorTaskIds],
  );

  // Reload when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Trigger TickTick sync if connected
    if (isTickTickConnected) {
      try {
        await syncTickTickTasks();
      } catch (error) {
        console.error("Manual TickTick sync failed:", error);
      }
    }
    await loadTasks();
    setIsRefreshing(false);
  }, [loadTasks, isTickTickConnected]);

  const handleAddTask = useCallback(() => {
    router.push("/task/create");
  }, [router]);

  const toggleDoneSection = useCallback(() => {
    setIsDoneCollapsed((prev) => !prev);
  }, []);

  const handleToggleComplete = useCallback(
    async (taskId: number) => {
      const result = await toggleTaskCompletion(taskId);
      if (result.success) {
        // Reload tasks to reflect new state
        loadTasks();
        // Trigger debounced TickTick sync if connected
        if (isTickTickConnected) {
          triggerDebouncedSync();
        }
      }
    },
    [loadTasks, isTickTickConnected],
  );

  const handleRetrySyncError = useCallback(
    async (taskId: number) => {
      // Mark as pending
      setPendingTaskIds((prev) => new Set(prev).add(taskId));
      setErrorTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      try {
        // Trigger a full sync
        await syncTickTickTasks();
        // Remove from pending
        setPendingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        // Reload tasks
        loadTasks();
      } catch {
        // Mark as error again
        setPendingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        setErrorTaskIds((prev) => new Set(prev).add(taskId));
      }
    },
    [loadTasks],
  );

  const handleFilterChange = useCallback((newFilter: TaskFilterType) => {
    setFilter(newFilter);
  }, []);

  // Build sections for SectionList with filtering
  const filteredToday = filterTasks(tasksBySection.today);
  const filteredUpcoming = filterTasks(tasksBySection.upcoming);
  const filteredDone = filterTasks(tasksBySection.done);

  const sections: TaskSectionData[] = [
    { title: "Today", data: filteredToday },
    { title: "Upcoming", data: filteredUpcoming },
    {
      title: "Done",
      data: isDoneCollapsed ? [] : filteredDone,
      isCollapsible: true,
    },
  ];

  const totalTasks = filteredToday.length + filteredUpcoming.length + filteredDone.length;
  const totalUnfilteredTasks =
    tasksBySection.today.length + tasksBySection.upcoming.length + tasksBySection.done.length;

  if (Platform.OS === "web") {
    return (
      <View testID="screen-tasks" className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Tasks require iOS or Android</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View testID="screen-tasks" className="flex-1 bg-background">
        {/* Header */}
        <View className="border-b border-border bg-background px-4 pb-4 pt-12">
          <View className="flex-row items-center justify-between">
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

          {/* Filter pills - only show when TickTick is connected */}
          {isTickTickConnected && totalUnfilteredTasks > 0 && (
            <View testID="task-filter-pills" className="mt-3 flex-row gap-2">
              <TouchableOpacity
                testID="filter-all"
                onPress={() => handleFilterChange("all")}
                className={`rounded-full px-3 py-1.5 ${
                  filter === "all" ? "bg-primary" : "bg-muted"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filter === "all" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="filter-ticktick"
                onPress={() => handleFilterChange("ticktick")}
                className={`flex-row items-center rounded-full px-3 py-1.5 ${
                  filter === "ticktick" ? "bg-primary" : "bg-muted"
                }`}
              >
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={filter === "ticktick" ? "#fff" : "#888"}
                />
                <Text
                  className={`ml-1 text-sm font-medium ${
                    filter === "ticktick" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  TickTick
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="filter-local"
                onPress={() => handleFilterChange("local")}
                className={`rounded-full px-3 py-1.5 ${
                  filter === "local" ? "bg-primary" : "bg-muted"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filter === "local" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Local Only
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Task List */}
        {isLoading ? (
          <View testID="task-loading-skeleton" className="flex-1 pt-4">
            <SkeletonTaskItem />
            <SkeletonTaskItem />
            <SkeletonTaskItem />
            <SkeletonTaskItem />
            <SkeletonTaskItem />
          </View>
        ) : totalTasks === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <EmptyTasks testID="task-empty-state" />
          </View>
        ) : (
          <SectionList
            testID="task-list"
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SwipeableTaskItem
                task={item}
                onToggleComplete={handleToggleComplete}
                syncStatus={getSyncStatus(item)}
                onRetrySyncError={handleRetrySyncError}
              />
            )}
            renderSectionHeader={({ section }) => (
              <SectionHeader
                title={section.title}
                count={section.title === "Done" ? filteredDone.length : section.data.length}
                isCollapsed={section.title === "Done" ? isDoneCollapsed : undefined}
                onToggle={section.title === "Done" ? toggleDoneSection : undefined}
                isCollapsible={section.isCollapsible}
              />
            )}
            renderSectionFooter={({ section }) => {
              // Show empty state for Today/Upcoming if empty
              // For Done section, show empty only when expanded and empty
              if (section.title === "Done") {
                if (!isDoneCollapsed && filteredDone.length === 0) {
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
    </GestureHandlerRootView>
  );
}
