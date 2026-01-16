// Mock for react-native in vitest environment
export const Platform = {
  OS: "ios",
  select: (config: Record<string, unknown>) => config.ios ?? config.default,
};

export const AppState = {
  currentState: "active",
  addEventListener: () => ({ remove: () => {} }),
};

export const View = "View";
export const Text = "Text";
export const ActivityIndicator = "ActivityIndicator";
export const ScrollView = "ScrollView";
export const TouchableOpacity = "TouchableOpacity";
