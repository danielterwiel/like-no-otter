import { useState, useCallback } from "react";
import { View, TextInput, TouchableOpacity, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { createTask, type TaskPriority } from "@/lib/db";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "none", label: "None", color: "#888" },
  { value: "low", label: "Low", color: "#3b82f6" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "high", label: "High", color: "#ef4444" },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function CreateTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await createTask({
      title: title.trim(),
      dueDate: dueDate ? toISODateString(dueDate) : null,
      priority,
    });

    setIsSaving(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.error || "Failed to save task");
    }
  }, [title, dueDate, priority, router]);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  }, []);

  const clearDueDate = useCallback(() => {
    setDueDate(null);
    setShowDatePicker(false);
  }, []);

  if (Platform.OS === "web") {
    return (
      <View
        testID="screen-task-create"
        className="flex-1 items-center justify-center bg-background p-4"
      >
        <Text className="text-muted-foreground">Task creation requires iOS or Android</Text>
      </View>
    );
  }

  return (
    <View testID="screen-task-create" className="flex-1 bg-background">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="mb-2 text-sm font-medium text-muted-foreground">Title *</Text>
            <TextInput
              testID="task-title-input"
              className="rounded-lg border border-input bg-background px-4 py-3 text-foreground"
              placeholder="What needs to be done?"
              placeholderTextColor="#888"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError(null);
              }}
              autoFocus
              returnKeyType="done"
            />
          </CardContent>
        </Card>

        {/* Due Date */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="mb-2 text-sm font-medium text-muted-foreground">Due Date</Text>
            <Pressable
              testID="task-due-date-button"
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center justify-between rounded-lg border border-input bg-background px-4 py-3"
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#888" />
                <Text className={`ml-2 ${dueDate ? "text-foreground" : "text-muted-foreground"}`}>
                  {dueDate ? formatDate(dueDate) : "No due date"}
                </Text>
              </View>
              {dueDate && (
                <TouchableOpacity testID="clear-due-date" onPress={clearDueDate}>
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </Pressable>

            {showDatePicker && (
              <View className="mt-2">
                <DateTimePicker
                  testID="date-picker"
                  value={dueDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="mt-2 self-end rounded-lg bg-primary px-4 py-2"
                  >
                    <Text className="font-medium text-primary-foreground">Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </CardContent>
        </Card>

        {/* Priority */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="mb-2 text-sm font-medium text-muted-foreground">Priority</Text>
            <View className="flex-row flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  testID={`priority-${option.value}`}
                  onPress={() => setPriority(option.value)}
                  className={`flex-row items-center rounded-full border px-4 py-2 ${
                    priority === option.value
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background"
                  }`}
                >
                  <View
                    style={{ backgroundColor: option.color }}
                    className="mr-2 h-3 w-3 rounded-full"
                  />
                  <Text
                    className={
                      priority === option.value
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <View className="mx-4 mt-4">
            <Text className="text-center text-destructive">{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View className="border-t border-border bg-background p-4">
        <TouchableOpacity
          testID="save-task-button"
          onPress={handleSave}
          disabled={isSaving || !title.trim()}
          className={`flex-row items-center justify-center rounded-lg py-4 ${
            title.trim() && !isSaving ? "bg-primary" : "bg-muted"
          }`}
        >
          <Ionicons
            name="checkmark"
            size={24}
            color={title.trim() && !isSaving ? "#fff" : "#888"}
          />
          <Text
            className={`ml-2 text-lg font-semibold ${
              title.trim() && !isSaving ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
