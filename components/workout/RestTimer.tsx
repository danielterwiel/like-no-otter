import { useEffect, useRef, useCallback } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { formatRestTime } from "@/lib/workout";

interface RestTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  onSkip: () => void;
  onComplete?: () => void;
  testID?: string;
}

export function RestTimer({
  remainingSeconds,
  totalSeconds,
  onSkip,
  onComplete,
  testID,
}: RestTimerProps) {
  const hasTriggeredComplete = useRef(false);

  // Trigger haptic and callback when timer reaches 0
  useEffect(() => {
    if (remainingSeconds === 0 && !hasTriggeredComplete.current) {
      hasTriggeredComplete.current = true;
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete?.();
    } else if (remainingSeconds > 0) {
      hasTriggeredComplete.current = false;
    }
  }, [remainingSeconds, onComplete]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSkip();
  }, [onSkip]);

  // Calculate progress percentage for visual indicator
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  return (
    <Card testID={testID} className="mb-4 border-2 border-primary/50 bg-primary/10">
      <CardContent className="items-center py-6">
        {/* Timer icon and label */}
        <View className="mb-2 flex-row items-center">
          <Ionicons name="timer-outline" size={24} color="#3b82f6" />
          <Text className="ml-2 text-lg font-semibold text-primary">Rest Timer</Text>
        </View>

        {/* Countdown display */}
        <Text
          testID={`${testID}-countdown`}
          className="mb-4 text-5xl font-bold tracking-wider text-foreground"
        >
          {formatRestTime(remainingSeconds)}
        </Text>

        {/* Progress bar */}
        <View className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <View
            className="h-full bg-primary"
            style={{ width: `${progress * 100}%` }}
            testID={`${testID}-progress`}
          />
        </View>

        {/* Skip button */}
        <TouchableOpacity
          testID={`${testID}-skip-button`}
          onPress={handleSkip}
          className="flex-row items-center rounded-lg border border-primary px-6 py-3"
        >
          <Ionicons name="play-skip-forward" size={20} color="#3b82f6" />
          <Text className="ml-2 font-semibold text-primary">Skip Rest</Text>
        </TouchableOpacity>
      </CardContent>
    </Card>
  );
}
