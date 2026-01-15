import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import { useMigrations } from "@/lib/db";
import { db, type Database } from "@/lib/db";
import { Text } from "@/components/ui/text";
import { seedExercises } from "@/lib/db/seed";

const DatabaseContext = createContext<Database | null>(null);

export function useDatabase(): Database {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { isReady: migrationsReady, error } = useMigrations();
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    async function runSeeding() {
      if (migrationsReady && !isSeeded) {
        await seedExercises();
        setIsSeeded(true);
      }
    }
    runSeeding();
  }, [migrationsReady, isSeeded]);

  const isReady = migrationsReady && isSeeded;

  if (error) {
    return (
      <View testID="db-error" className="flex-1 items-center justify-center bg-background">
        <Text className="text-destructive">Database Error: {error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View testID="db-loading" className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-muted-foreground">Loading database...</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}
