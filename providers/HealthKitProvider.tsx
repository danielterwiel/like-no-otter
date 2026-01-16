import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { healthKitService, type HealthKitAuthStatus } from "@/lib/health/healthkit";

const ONBOARDING_COMPLETED_KEY = "@healthkit_onboarding_completed";
const AUTH_STATUS_KEY = "@healthkit_auth_status";

interface HealthKitContextValue {
  isAvailable: boolean;
  authStatus: HealthKitAuthStatus;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  requestAuthorization: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const HealthKitContext = createContext<HealthKitContextValue | null>(null);

export function useHealthKit(): HealthKitContextValue {
  const context = useContext(HealthKitContext);
  if (!context) {
    throw new Error("useHealthKit must be used within a HealthKitProvider");
  }
  return context;
}

interface HealthKitProviderProps {
  children: ReactNode;
}

export function HealthKitProvider({ children }: HealthKitProviderProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [authStatus, setAuthStatus] = useState<HealthKitAuthStatus>("unknown");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Default to true to prevent flash
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from storage and check availability
  useEffect(() => {
    async function initialize() {
      try {
        // Check if HealthKit is available (iOS only)
        const available = await healthKitService.isAvailable();
        setIsAvailable(available);

        // Load persisted onboarding state
        const completedStr = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        const completed = completedStr === "true";
        setHasCompletedOnboarding(completed);

        // If available and onboarding completed, re-initialize to verify auth status
        // Note: initHealthKit doesn't re-prompt if already authorized, it just verifies
        if (available && completed) {
          const success = await healthKitService.requestAuthorization();
          const status = success ? "authorized" : "denied";
          setAuthStatus(status);
          await AsyncStorage.setItem(AUTH_STATUS_KEY, status);
        } else if (!available) {
          // Not on iOS - mark onboarding as completed to skip it
          setHasCompletedOnboarding(true);
          setAuthStatus("unknown");
        } else {
          // Available but onboarding not completed - show onboarding
          setHasCompletedOnboarding(false);
        }
      } catch (error) {
        console.error("Failed to initialize HealthKit:", error);
        // On error, skip onboarding to prevent blocking the app
        setHasCompletedOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;

    const success = await healthKitService.requestAuthorization();

    // Re-check auth status after request
    const status = await healthKitService.getAuthStatus();
    setAuthStatus(status);
    await AsyncStorage.setItem(AUTH_STATUS_KEY, status);

    return success;
  }, [isAvailable]);

  const openSettings = useCallback(async (): Promise<void> => {
    await healthKitService.openHealthSettings();
  }, []);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    // Request authorization first
    await requestAuthorization();

    // Mark onboarding as completed
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setHasCompletedOnboarding(true);
  }, [requestAuthorization]);

  const skipOnboarding = useCallback(async (): Promise<void> => {
    // Mark onboarding as completed without requesting auth
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setHasCompletedOnboarding(true);
    setAuthStatus("denied");
  }, []);

  const value: HealthKitContextValue = {
    isAvailable,
    authStatus,
    hasCompletedOnboarding,
    isLoading,
    requestAuthorization,
    openSettings,
    completeOnboarding,
    skipOnboarding,
  };

  return <HealthKitContext.Provider value={value}>{children}</HealthKitContext.Provider>;
}
