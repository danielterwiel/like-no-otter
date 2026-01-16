import { useState, useCallback } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";

interface SetInputProps {
  onAddSet: (weight: number | null, reps: number | null, isWarmup: boolean) => void;
  testID?: string;
}

export function SetInput({ onAddSet, testID }: SetInputProps) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [isWarmup, setIsWarmup] = useState(false);

  const handleAddSet = useCallback(() => {
    const weightNum = weight.trim() ? parseFloat(weight) : null;
    const repsNum = reps.trim() ? parseInt(reps, 10) : null;
    onAddSet(weightNum, repsNum, isWarmup);
    setWeight("");
    setReps("");
    setIsWarmup(false);
  }, [weight, reps, isWarmup, onAddSet]);

  const isValid = weight.trim() || reps.trim();

  return (
    <View testID={testID} className="rounded-lg border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="mb-1 text-sm text-muted-foreground">Weight (lbs)</Text>
          <TextInput
            testID={`${testID}-weight`}
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            keyboardType="decimal-pad"
            className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
            placeholderTextColor="#888"
          />
        </View>

        <View className="flex-1">
          <Text className="mb-1 text-sm text-muted-foreground">Reps</Text>
          <TextInput
            testID={`${testID}-reps`}
            value={reps}
            onChangeText={setReps}
            placeholder="0"
            keyboardType="number-pad"
            className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <View className="mb-3 flex-row items-center">
        <TouchableOpacity
          testID={`${testID}-warmup-toggle`}
          onPress={() => setIsWarmup(!isWarmup)}
          className="flex-row items-center"
        >
          <View
            className={`mr-2 h-5 w-5 items-center justify-center rounded border ${
              isWarmup ? "border-orange-500 bg-orange-500" : "border-input bg-background"
            }`}
          >
            {isWarmup && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text className="text-foreground">Warmup Set</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID={`${testID}-add-button`}
        onPress={handleAddSet}
        disabled={!isValid}
        className={`flex-row items-center justify-center rounded-lg py-3 ${
          isValid ? "bg-primary" : "bg-muted"
        }`}
      >
        <Ionicons name="add" size={20} color={isValid ? "#fff" : "#888"} />
        <Text
          className={`ml-1 font-semibold ${isValid ? "text-primary-foreground" : "text-muted-foreground"}`}
        >
          Add Set
        </Text>
      </TouchableOpacity>
    </View>
  );
}
