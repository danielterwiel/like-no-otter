import * as React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export type DataSource = "Health" | "Whoop";

interface SourceBadgeProps {
  source: DataSource;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <View className="rounded-full bg-primary/10 px-2 py-0.5">
      <Text className="text-xs font-medium text-primary">{source}</Text>
    </View>
  );
}
