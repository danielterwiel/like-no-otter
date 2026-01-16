import * as React from "react";
import { Animated, View, TouchableOpacity, Platform } from "react-native";
import { Portal } from "@rn-primitives/portal";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const toastIcons: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

const toastColors: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "bg-green-500/10 border-green-500/20", icon: "#22c55e" },
  error: { bg: "bg-destructive/10 border-destructive/20", icon: "#ef4444" },
  warning: { bg: "bg-yellow-500/10 border-yellow-500/20", icon: "#eab308" },
  info: { bg: "bg-blue-500/10 border-blue-500/20", icon: "#3b82f6" },
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(toast.id);
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [opacity, translateY, toast.duration, toast.id, onDismiss]);

  const colors = toastColors[toast.type];

  return (
    <Animated.View
      testID={`toast-${toast.type}`}
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View
        className={cn("mx-4 mb-2 flex-row items-center rounded-lg border px-4 py-3", colors.bg)}
      >
        <Ionicons name={toastIcons[toast.type]} size={20} color={colors.icon} />
        <View className="ml-3 flex-1">
          <Text className="font-medium">{toast.title}</Text>
          {toast.description && (
            <Text className="mt-0.5 text-sm text-muted-foreground">{toast.description}</Text>
          )}
        </View>
        <TouchableOpacity
          testID="toast-dismiss"
          onPress={() => onDismiss(toast.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal name="toast">
        <View
          testID="toast-container"
          className="absolute left-0 right-0"
          style={{
            top: Platform.OS === "ios" ? 60 : 40,
            zIndex: 9999,
          }}
          pointerEvents="box-none"
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </View>
      </Portal>
    </ToastContext.Provider>
  );
}
