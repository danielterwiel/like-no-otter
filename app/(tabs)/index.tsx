import * as React from "react";
import { View, ScrollView, Platform, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealthKit } from "@/providers/HealthKitProvider";
import {
  RecoveryCard,
  StrainCard,
  RHRTrendChart,
  RecoveryTrendChart,
  TodayHealthSummaryCard,
} from "@/components/health";
import { WorkoutCard } from "@/components/workout";
import { SwipeableTaskItem, type TaskSyncStatus } from "@/components/tasks";
import {
  fetchTodayHealthData,
  fetchRHRTrendData,
  type HealthData,
  type RHRTrendData,
} from "@/lib/health";
import { useConnections } from "@/lib/integrations/connection-manager";
import {
  getLatestWhoopRecovery,
  getLatestWhoopCycle,
  getLatestWhoopSleep,
  getRecoveryTrendData,
  type WhoopRecoveryData,
  type WhoopCycleData,
  type WhoopSleepData,
  type RecoveryTrendData,
} from "@/lib/db/queries/whoop";
import {
  getWorkoutHistory,
  type WorkoutHistoryItem,
} from "@/lib/db/queries/workouts";
import {
  getTasksBySection,
  toggleTaskCompletion,
  type TaskRecord,
  type TasksBySection,
} from "@/lib/db";
import { triggerDebouncedSync } from "@/lib/integrations/ticktick/sync";

export default function TodayScreen() {
  const router = useRouter();
  const { authStatus, isAvailable: _isAvailable } = useHealthKit();
  const { isConnected } = useConnections();

  // Health data state
  const [healthData, setHealthData] = React.useState<HealthData | null>(null);
  const [rhrTrendData, setRhrTrendData] = React.useState<RHRTrendData | null>(null);
  const [isHealthLoading, setIsHealthLoading] = React.useState(true);

  // Whoop data state
  const whoopConnected = isConnected("whoop");
  const [whoopRecovery, setWhoopRecovery] = React.useState<WhoopRecoveryData | null>(null);
  const [whoopStrain, setWhoopStrain] = React.useState<WhoopCycleData | null>(null);
  const [whoopSleep, setWhoopSleep] = React.useState<WhoopSleepData | null>(null);
  const [recoveryTrendData, setRecoveryTrendData] = React.useState<RecoveryTrendData | null>(null);
  const [isWhoopLoading, setIsWhoopLoading] = React.useState(true);

  // Workout data state
  const [todayWorkouts, setTodayWorkouts] = React.useState<WorkoutHistoryItem[]>([]);
  const [isWorkoutsLoading, setIsWorkoutsLoading] = React.useState(true);

  // Task data state
  const isTickTickConnected = isConnected("ticktick");
  const [tasksBySection, setTasksBySection] = React.useState<TasksBySection>({
    today: [],
    upcoming: [],
    done: [],
  });
  const [isTasksLoading, setIsTasksLoading] = React.useState(true);
  const [pendingTaskIds, _setPendingTaskIds] = React.useState<Set<number>>(new Set());
  const [errorTaskIds, _setErrorTaskIds] = React.useState<Set<number>>(new Set());

  // Load health data
  React.useEffect(() => {
    async function loadHealthData() {
      if (Platform.OS === "ios" && authStatus === "authorized") {
        setIsHealthLoading(true);
        const [data, trendData] = await Promise.all([
          fetchTodayHealthData(),
          fetchRHRTrendData(),
        ]);
        setHealthData(data);
        setRhrTrendData(trendData);
        setIsHealthLoading(false);
      } else {
        setIsHealthLoading(false);
        setHealthData({ sleep: null, steps: null, calories: null, heartRate: null });
        setRhrTrendData({ points: [] });
      }
    }
    loadHealthData();
  }, [authStatus]);

  // Load Whoop data
  React.useEffect(() => {
    async function loadWhoopData() {
      if (!whoopConnected) {
        setIsWhoopLoading(false);
        setWhoopRecovery(null);
        setWhoopStrain(null);
        setWhoopSleep(null);
        setRecoveryTrendData(null);
        return;
      }

      setIsWhoopLoading(true);
      try {
        const [recovery, strain, sleep, recoveryTrend] = await Promise.all([
          getLatestWhoopRecovery(),
          getLatestWhoopCycle(),
          getLatestWhoopSleep(),
          getRecoveryTrendData(7),
        ]);
        setWhoopRecovery(recovery);
        setWhoopStrain(strain);
        setWhoopSleep(sleep);
        setRecoveryTrendData(recoveryTrend);
      } catch (error) {
        console.error("Failed to load Whoop data:", error);
      } finally {
        setIsWhoopLoading(false);
      }
    }
    loadWhoopData();
  }, [whoopConnected]);

  // Load today's workouts
  React.useEffect(() => {
    async function loadTodayWorkouts() {
      setIsWorkoutsLoading(true);
      try {
        const allWorkouts = await getWorkoutHistory();

        // Filter for today's workouts
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const workoutsToday = allWorkouts.filter((workout) => {
          const workoutDate = new Date(workout.startTime);
          return workoutDate >= todayStart && workoutDate < todayEnd;
        });

        setTodayWorkouts(workoutsToday);
      } catch (error) {
        console.error("Failed to load workouts:", error);
      } finally {
        setIsWorkoutsLoading(false);
      }
    }
    loadTodayWorkouts();
  }, []);

  // Load tasks
  React.useEffect(() => {
    async function loadTasks() {
      setIsTasksLoading(true);
      try {
        const sections = await getTasksBySection();
        setTasksBySection(sections);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsTasksLoading(false);
      }
    }
    loadTasks();
  }, []);

  // Get sync status for a task
  const getSyncStatus = React.useCallback(
    (task: TaskRecord): TaskSyncStatus => {
      if (pendingTaskIds.has(task.id)) return "pending";
      if (errorTaskIds.has(task.id)) return "error";
      if (task.ticktickId) return "synced";
      return "local";
    },
    [pendingTaskIds, errorTaskIds],
  );

  // Handle task completion toggle
  const handleToggleComplete = React.useCallback(
    async (taskId: number) => {
      const result = await toggleTaskCompletion(taskId);
      if (result.success) {
        // Reload tasks
        const sections = await getTasksBySection();
        setTasksBySection(sections);
        // Trigger TickTick sync if connected
        if (isTickTickConnected) {
          triggerDebouncedSync();
        }
      }
    },
    [isTickTickConnected],
  );

  // Handle retry sync error (stub for now)
  const handleRetrySyncError = React.useCallback(async (_taskId: number) => {
    // Placeholder - implement if needed
  }, []);

  // Calculate summary stats
  const todayTasksCount = tasksBySection.today.length;
  const completedTasksToday = tasksBySection.done.filter((task) => {
    if (!task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    const today = new Date();
    return (
      completedDate.getDate() === today.getDate() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const totalWorkoutsToday = todayWorkouts.length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView
        testID="screen-today"
        className="flex-1 bg-background"
        contentContainerClassName="p-4 gap-4"
      >
      {/* Hero Metric - Recovery or Daily Summary */}
      {whoopConnected && whoopRecovery?.recoveryScore !== null ? (
        <RecoveryCard data={whoopRecovery} isLoading={isWhoopLoading} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Ionicons name="fitness-outline" size={24} color="#6366f1" />
                <Text className="mt-1 text-2xl font-bold">{totalWorkoutsToday}</Text>
                <Text className="text-xs text-muted-foreground">
                  {totalWorkoutsToday === 1 ? "Workout" : "Workouts"}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
                <Text className="mt-1 text-2xl font-bold">{completedTasksToday}</Text>
                <Text className="text-xs text-muted-foreground">Completed</Text>
              </View>
              <View className="items-center">
                <Ionicons name="list-outline" size={24} color="#f59e0b" />
                <Text className="mt-1 text-2xl font-bold">{todayTasksCount}</Text>
                <Text className="text-xs text-muted-foreground">Due Today</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Health Metrics Summary */}
      <TodayHealthSummaryCard
        healthData={healthData}
        whoopRecovery={whoopRecovery}
        whoopStrain={whoopStrain}
        whoopSleep={whoopSleep}
        isLoading={isHealthLoading || isWhoopLoading}
      />

      {/* Optional: Whoop Strain if connected and recovery not shown as hero */}
      {whoopConnected && whoopRecovery?.recoveryScore === null && whoopStrain && (
        <View className="flex-row gap-4">
          <View className="flex-1">
            <StrainCard data={whoopStrain} isLoading={isWhoopLoading} />
          </View>
          <View className="flex-1" />
        </View>
      )}

      {/* Today's Workouts */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Today's Workouts</CardTitle>
          {totalWorkoutsToday === 0 && (
            <TouchableOpacity
              onPress={() => router.push("/workout/setup")}
              className="rounded-full bg-primary px-3 py-1"
            >
              <Text className="text-xs font-medium text-primary-foreground">Start</Text>
            </TouchableOpacity>
          )}
        </CardHeader>
        <CardContent>
          {isWorkoutsLoading ? (
            <View className="items-center py-4">
              <Text className="text-sm text-muted-foreground">Loading workouts...</Text>
            </View>
          ) : todayWorkouts.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="barbell-outline" size={40} color="#d1d5db" />
              <Text className="mt-2 text-sm text-muted-foreground">No workouts yet today</Text>
              <TouchableOpacity
                onPress={() => router.push("/workout/setup")}
                className="mt-3 rounded-lg bg-primary px-4 py-2"
              >
                <Text className="font-medium text-primary-foreground">Start Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {todayWorkouts.slice(0, 3).map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workout/${workout.id}`)}
                />
              ))}
              {todayWorkouts.length > 3 && (
                <TouchableOpacity
                  onPress={() => router.push("/workouts")}
                  className="py-2"
                >
                  <Text className="text-center text-sm text-primary">
                    View all {todayWorkouts.length} workouts
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <View>
            <CardTitle>Tasks</CardTitle>
            <Text className="text-xs text-muted-foreground">
              {todayTasksCount} due today
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/tasks")}
            className="rounded-full bg-muted px-3 py-1"
          >
            <Text className="text-xs font-medium text-foreground">View All</Text>
          </TouchableOpacity>
        </CardHeader>
        <CardContent>
          {isTasksLoading ? (
            <View className="items-center py-4">
              <Text className="text-sm text-muted-foreground">Loading tasks...</Text>
            </View>
          ) : tasksBySection.today.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="checkmark-done-outline" size={40} color="#d1d5db" />
              <Text className="mt-2 text-sm text-muted-foreground">No tasks due today</Text>
              <TouchableOpacity
                onPress={() => router.push("/task/create")}
                className="mt-3 rounded-lg bg-primary px-4 py-2"
              >
                <Text className="font-medium text-primary-foreground">Add Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-2">
              {tasksBySection.today.slice(0, 5).map((task) => (
                <SwipeableTaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  syncStatus={getSyncStatus(task)}
                  onRetrySyncError={handleRetrySyncError}
                />
              ))}
              {tasksBySection.today.length > 5 && (
                <TouchableOpacity
                  onPress={() => router.push("/tasks")}
                  className="py-2"
                >
                  <Text className="text-center text-sm text-primary">
                    {tasksBySection.today.length - 5} more tasks
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <View className="gap-4">
        <Text className="text-xl font-semibold">Trends</Text>

        {/* RHR Trend */}
        <RHRTrendChart data={rhrTrendData} isLoading={isHealthLoading} />

        {/* Recovery Trend (if Whoop connected) */}
        {whoopConnected && (
          <RecoveryTrendChart data={recoveryTrendData} isLoading={isWhoopLoading} />
        )}
      </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </GestureHandlerRootView>
  );
}
