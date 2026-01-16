import * as React from "react";
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from "react-native";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: ViewStyle;
  /**
   * Width of the skeleton. Can be a number (pixels) or percentage string.
   * @default "100%"
   */
  width?: DimensionValue;
  /**
   * Height of the skeleton. Can be a number (pixels) or percentage string.
   * @default 16
   */
  height?: DimensionValue;
  /**
   * Whether to show the skeleton with a rounded shape (for avatars, icons).
   * @default false
   */
  circle?: boolean;
}

export function Skeleton({
  className,
  style,
  width = "100%",
  height = 16,
  circle = false,
}: SkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const sizeStyle: ViewStyle = {
    width: width,
    height: height,
    borderRadius: circle ? (typeof height === "number" ? height / 2 : 9999) : 4,
  };

  return (
    <Animated.View
      style={[styles.skeleton, sizeStyle, { opacity }, style]}
      className={cn("bg-muted", className)}
    />
  );
}

/**
 * A skeleton loader for a card component, matching the health card layout.
 */
export function SkeletonCard({ testID }: { testID?: string }) {
  return (
    <View testID={testID} className="rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3 mb-3">
        <Skeleton circle width={40} height={40} />
        <Skeleton width={80} height={16} />
      </View>
      <Skeleton width="60%" height={28} className="mb-2" />
      <Skeleton width="80%" height={14} />
    </View>
  );
}

/**
 * A skeleton loader for workout history cards.
 */
export function SkeletonWorkoutCard() {
  return (
    <View className="rounded-xl border border-border bg-card p-4 mb-3">
      <Skeleton width="40%" height={14} className="mb-2" />
      <Skeleton width="70%" height={20} className="mb-3" />
      <View className="flex-row gap-2">
        <Skeleton width={60} height={24} className="rounded-full" />
        <Skeleton width={60} height={24} className="rounded-full" />
        <Skeleton width={60} height={24} className="rounded-full" />
      </View>
    </View>
  );
}

/**
 * A skeleton loader for task list items.
 */
export function SkeletonTaskItem() {
  return (
    <View className="flex-row items-center bg-card px-4 py-3 border-b border-border">
      <Skeleton circle width={24} height={24} className="mr-3" />
      <View className="flex-1">
        <Skeleton width="70%" height={16} className="mb-1" />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#e0e0e0",
  },
});
