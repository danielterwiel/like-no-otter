import { Platform, Linking } from "react-native";

// HealthKit permissions we need
const HEALTHKIT_PERMISSIONS = {
  read: ["SleepAnalysis", "StepCount", "ActiveEnergyBurned", "RestingHeartRate"] as string[],
  write: ["Workout"] as string[],
};

export type HealthKitAuthStatus = "unknown" | "authorized" | "denied" | "not_determined";

interface HealthKitService {
  isAvailable: () => Promise<boolean>;
  getAuthStatus: () => Promise<HealthKitAuthStatus>;
  requestAuthorization: () => Promise<boolean>;
  openHealthSettings: () => Promise<void>;
}

// Create platform-specific implementations
function createIOSHealthKitService(): HealthKitService {
  // Track auth status locally since checking it is complex with the library
  let cachedAuthStatus: HealthKitAuthStatus = "not_determined";

  // Dynamically import react-native-health only on iOS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let AppleHealthKit: any = null;

  const getHealthKit = async () => {
    if (!AppleHealthKit) {
      const module = await import("react-native-health");
      AppleHealthKit = module.default;
    }
    return AppleHealthKit;
  };

  return {
    isAvailable: async () => {
      try {
        const healthKit = await getHealthKit();
        return new Promise<boolean>((resolve) => {
          healthKit.isAvailable((error: Error | null, available: boolean | null) => {
            resolve(!error && !!available);
          });
        });
      } catch {
        return false;
      }
    },

    getAuthStatus: async () => {
      // Return cached status - actual status is determined when authorization is requested
      return cachedAuthStatus;
    },

    requestAuthorization: async () => {
      try {
        const healthKit = await getHealthKit();
        return new Promise<boolean>((resolve) => {
          healthKit.initHealthKit({ permissions: HEALTHKIT_PERMISSIONS }, (error: Error | null) => {
            if (error) {
              // Authorization was denied or failed
              cachedAuthStatus = "denied";
              resolve(false);
            } else {
              // Authorization succeeded
              cachedAuthStatus = "authorized";
              resolve(true);
            }
          });
        });
      } catch {
        cachedAuthStatus = "denied";
        return false;
      }
    },

    openHealthSettings: async () => {
      // Deep link to iOS Health app settings
      const url = "x-apple-health://";
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to main Settings app
        await Linking.openSettings();
      }
    },
  };
}

// Mock service for web/non-iOS platforms
function createMockHealthKitService(): HealthKitService {
  return {
    isAvailable: async () => false,
    getAuthStatus: async () => "unknown",
    requestAuthorization: async () => false,
    openHealthSettings: async () => {
      await Linking.openSettings();
    },
  };
}

// Export the appropriate service based on platform
export const healthKitService: HealthKitService =
  Platform.OS === "ios" ? createIOSHealthKitService() : createMockHealthKitService();

// Export permission types for use elsewhere
export { HEALTHKIT_PERMISSIONS };
