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
import { retrySyncUnsyncedWorkouts } from "@/lib/db/queries/workouts";
import { invalidateHealthQueries } from "./QueryProvider";
import { useHealthKit } from "./HealthKitProvider";
import { useToast } from "@/components/ui/toast";

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
  const { showToast } = useToast();

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
      // Sync health data from HealthKit to SQLite
      const result = await syncHealthData();
      setLastSyncResult(result);

      // Invalidate TanStack Query cache if sync was successful
      if (result.success && result.recordsInserted > 0) {
        invalidateHealthQueries();
      }

      // Retry syncing any unsynced workouts to HealthKit
      const retryResult = await retrySyncUnsyncedWorkouts();
      if (retryResult.synced > 0) {
        console.log(`Synced ${retryResult.synced} workouts to HealthKit`);
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

      // Show non-blocking toast for sync errors
      showToast({
        type: "error",
        title: "Sync failed",
        description: "Health data could not be synced. Using cached data.",
        duration: 5000,
      });

      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isAvailable, authStatus, showToast]);

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
