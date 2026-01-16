import { useCallback } from "react";
import { View, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/text";
import type { TaskRecord, TaskPriority } from "@/lib/db";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: "#888",
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#ef4444",
};

const SWIPE_THRESHOLD = 80;
const COMPLETE_COLOR = "#22c55e"; // green-500
const TICKTICK_COLOR = "#4285f4"; // TickTick brand blue

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

function triggerHaptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export type TaskSyncStatus = "synced" | "pending" | "error" | "local";

interface SwipeableTaskItemProps {
  task: TaskRecord;
  onToggleComplete: (taskId: number) => void;
  syncStatus?: TaskSyncStatus;
  onRetrySyncError?: (taskId: number) => void;
}

export function SwipeableTaskItem({
  task,
  onToggleComplete,
  syncStatus = task.ticktickId ? "synced" : "local",
  onRetrySyncError,
}: SwipeableTaskItemProps) {
  const translateX = useSharedValue(0);
  const formattedDue = formatDueDate(task.dueDate);
  const isOverdue = formattedDue === "Overdue";
  const isTickTickTask = !!task.ticktickId;

  const handleComplete = useCallback(() => {
    triggerHaptic();
    onToggleComplete(task.id);
  }, [task.id, onToggleComplete]);

  const handleCheckboxPress = useCallback(() => {
    triggerHaptic();
    onToggleComplete(task.id);
  }, [task.id, onToggleComplete]);

  const handleRetrySync = useCallback(() => {
    if (onRetrySyncError) {
      triggerHaptic();
      onRetrySyncError(task.id);
    }
  }, [task.id, onRetrySyncError]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(10)
    .onUpdate((event) => {
      // Only allow swiping right (positive direction)
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, SWIPE_THRESHOLD + 20);
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Complete the swipe action
        runOnJS(handleComplete)();
      }
      // Reset position
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const opacity = Math.min(translateX.value / SWIPE_THRESHOLD, 1);
    return {
      opacity,
    };
  });

  return (
    <View testID={`task-item-${task.id}`} className="relative">
      {/* Background action revealed on swipe */}
      <Animated.View
        style={[backgroundStyle]}
        className="absolute inset-y-0 left-0 w-24 items-center justify-center"
        testID="swipe-action-complete"
      >
        <View
          style={{ backgroundColor: COMPLETE_COLOR }}
          className="absolute inset-0 items-center justify-center"
        >
          <Ionicons name="checkmark-circle" size={28} color="#fff" />
        </View>
      </Animated.View>

      {/* Task content (swipeable) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[animatedStyle]}
          className="flex-row items-center border-b border-border bg-card px-4 py-3"
        >
          {/* Checkbox */}
          <TouchableOpacity
            testID={`task-checkbox-${task.id}`}
            onPress={handleCheckboxPress}
            className="mr-3"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View
              style={{
                backgroundColor: task.isCompleted ? COMPLETE_COLOR : "transparent",
                borderColor: task.isCompleted ? COMPLETE_COLOR : PRIORITY_COLORS[task.priority],
              }}
              className="h-6 w-6 items-center justify-center rounded-full border-2"
            >
              {task.isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>

          {/* Task content */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className={`font-medium ${task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {task.title}
              </Text>
              {/* TickTick badge for synced tasks */}
              {isTickTickTask && (
                <View
                  testID={`ticktick-badge-${task.id}`}
                  style={{ backgroundColor: TICKTICK_COLOR }}
                  className="ml-2 flex-row items-center rounded px-1.5 py-0.5"
                >
                  <Ionicons name="checkmark-done" size={10} color="#fff" />
                </View>
              )}
            </View>
            {formattedDue && (
              <Text
                className={`text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
              >
                {formattedDue}
              </Text>
            )}
          </View>

          {/* Sync status indicator */}
          {syncStatus === "pending" && (
            <View testID={`sync-pending-${task.id}`} className="ml-2">
              <ActivityIndicator size="small" color={TICKTICK_COLOR} />
            </View>
          )}
          {syncStatus === "error" && (
            <TouchableOpacity
              testID={`sync-error-${task.id}`}
              onPress={handleRetrySync}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="ml-2"
            >
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}

          {/* Priority indicator (only for incomplete tasks without checkbox color) */}
          {!task.isCompleted &&
            task.priority !== "none" &&
            syncStatus !== "pending" &&
            syncStatus !== "error" && (
              <View
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                className="ml-2 h-2 w-2 rounded-full"
              />
            )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
