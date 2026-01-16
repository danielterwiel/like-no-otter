import * as React from "react";
import { View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  /**
   * Icon name from Ionicons to display
   */
  icon: IconName;
  /**
   * Main title text
   */
  title: string;
  /**
   * Description text below the title
   */
  description?: string;
  /**
   * Optional action button/element
   */
  action?: React.ReactNode;
  /**
   * Icon color (defaults to muted gray)
   */
  iconColor?: string;
  /**
   * Icon size (defaults to 64)
   */
  iconSize?: number;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Test ID for E2E testing
   */
  testID?: string;
  /**
   * Additional style for the container
   */
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  iconColor = "#9ca3af",
  iconSize = 64,
  className,
  testID,
  style,
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      className={cn("items-center justify-center px-8 py-12", className)}
      style={style}
    >
      <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-muted/50">
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text className="text-center text-xl font-semibold text-foreground">{title}</Text>
      {description && (
        <Text className="mt-2 text-center text-base text-muted-foreground">{description}</Text>
      )}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
}

/**
 * Pre-configured empty state for workouts list
 */
export function EmptyWorkouts({ testID }: { testID?: string }) {
  return (
    <EmptyState
      testID={testID}
      icon="fitness-outline"
      title="No workouts yet"
      description="Start your first workout to begin tracking your progress"
    />
  );
}

/**
 * Pre-configured empty state for tasks list
 */
export function EmptyTasks({ testID }: { testID?: string }) {
  return (
    <EmptyState
      testID={testID}
      icon="checkbox-outline"
      title="No tasks yet"
      description="Tap the Add button to create your first task"
    />
  );
}

/**
 * Pre-configured empty state for HealthKit authorization denied
 */
export function EmptyHealthDenied({ testID }: { testID?: string }) {
  return (
    <EmptyState
      testID={testID}
      icon="heart-dislike-outline"
      iconColor="#ef4444"
      title="Health Access Denied"
      description="Enable HealthKit access in Settings to view your health metrics"
    />
  );
}

/**
 * Pre-configured empty state for no health data available
 */
export function EmptyHealthData({ testID }: { testID?: string }) {
  return (
    <EmptyState
      testID={testID}
      icon="analytics-outline"
      title="No health data"
      description="Your health metrics will appear here once Apple Health has data to share"
    />
  );
}
