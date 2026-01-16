import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { type ReactNode } from "react";

// Configure QueryClient with offline-first settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Always fetch from cache first, then revalidate
      networkMode: "offlineFirst",
      // Retry failed requests 3 times
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Same offline-first behavior for mutations
      networkMode: "offlineFirst",
    },
  },
});

// Always treat as online since we use local SQLite
onlineManager.setOnline(true);

export function getQueryClient(): QueryClient {
  return queryClient;
}

export function invalidateHealthQueries(): void {
  queryClient.invalidateQueries({ queryKey: ["health"] });
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
