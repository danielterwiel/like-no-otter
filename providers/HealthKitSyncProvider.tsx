import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { syncHealthData, type SyncResult } from "@/lib/health/sync";
import { invalidateHealthQueries } from "./QueryProvider";
import { useHealthKit } from "./HealthKitProvider";

interface HealthKitSyncContextValue {
  lastSyncResult: SyncResult | null;
  isSyncing: boolean;
  triggerSync: () => Promise<SyncResult>;
}

const HealthKitSyncContext = createContext<HealthKitSyncContextValue | null>(null);

export function useHealthKitSync(): HealthKitSyncContextValue {
  const context = useContext(HealthKitSyncContext);
  if (!context) {
    throw new Error("useHealthKitSync must be used within a HealthKitSyncProvider");
  }
  return context;
}

interface HealthKitSyncProviderProps {
  children: ReactNode;
}

export function HealthKitSyncProvider({ children }: HealthKitSyncProviderProps) {
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { authStatus, isAvailable } = useHealthKit();

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    // Skip sync if already syncing or not authorized
    if (isSyncing) {
      return {
        success: false,
        syncedAt: new Date(),
        recordsInserted: 0,
      };
    }

    // Skip sync on non-iOS or if HealthKit is not authorized
    if (Platform.OS !== "ios" || !isAvailable || authStatus !== "authorized") {
      return {
        success: true,
        syncedAt: new Date(),
        recordsInserted: 0,
      };
    }

    setIsSyncing(true);

    try {
      const result = await syncHealthData();
      setLastSyncResult(result);

      // Invalidate TanStack Query cache if sync was successful
      if (result.success && result.recordsInserted > 0) {
        invalidateHealthQueries();
      }

      return result;
    } catch (error) {
      console.error("Health data sync failed:", error);
      const errorResult: SyncResult = {
        success: false,
        syncedAt: new Date(),
        recordsInserted: 0,
      };
      setLastSyncResult(errorResult);
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isAvailable, authStatus]);

  // Sync on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      // Trigger sync when app comes to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        triggerSync();
      }
      appState.current = nextAppState;
    });

    // Initial sync when provider mounts and HealthKit is authorized
    if (Platform.OS === "ios" && isAvailable && authStatus === "authorized") {
      triggerSync();
    }

    return () => {
      subscription.remove();
    };
  }, [triggerSync, isAvailable, authStatus]);

  const value: HealthKitSyncContextValue = {
    lastSyncResult,
    isSyncing,
    triggerSync,
  };

  return <HealthKitSyncContext.Provider value={value}>{children}</HealthKitSyncContext.Provider>;
}
