import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import type { ServiceType, ConnectionStatus } from "@/lib/db/schema/connections";
import { clearTokens } from "./auth";

const DATABASE_NAME = "likenootter.db";
const IS_WEB = Platform.OS === "web";

export interface ConnectionRecord {
  id: number;
  service: ServiceType;
  status: ConnectionStatus;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export interface ConnectionsState {
  whoop: ConnectionRecord | null;
  ticktick: ConnectionRecord | null;
  strong: ConnectionRecord | null;
}

interface ConnectionRow {
  id: number;
  service: string;
  status: string;
  connected_at: number | null;
  last_sync_at: number | null;
  sync_error: string | null;
}

function parseConnectionRow(row: ConnectionRow): ConnectionRecord {
  return {
    id: row.id,
    service: row.service as ServiceType,
    status: row.status as ConnectionStatus,
    connectedAt: row.connected_at ? new Date(row.connected_at) : null,
    lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
    syncError: row.sync_error,
  };
}

export async function getConnection(service: ServiceType): Promise<ConnectionRecord | null> {
  if (IS_WEB) {
    return null;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const row = db.getFirstSync<ConnectionRow>(
      `SELECT * FROM connections WHERE service = ?`,
      service,
    );

    return row ? parseConnectionRow(row) : null;
  } catch (error) {
    console.error(`Failed to get connection for ${service}:`, error);
    return null;
  }
}

export async function getAllConnections(): Promise<ConnectionsState> {
  if (IS_WEB) {
    return { whoop: null, ticktick: null, strong: null };
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const rows = db.getAllSync<ConnectionRow>(`SELECT * FROM connections`);

    const result: ConnectionsState = {
      whoop: null,
      ticktick: null,
      strong: null,
    };

    for (const row of rows) {
      const connection = parseConnectionRow(row);
      result[connection.service] = connection;
    }

    return result;
  } catch (error) {
    console.error("Failed to get all connections:", error);
    return { whoop: null, ticktick: null, strong: null };
  }
}

export interface UpdateConnectionInput {
  service: ServiceType;
  status: ConnectionStatus;
  syncError?: string | null;
}

export async function updateConnection(input: UpdateConnectionInput): Promise<boolean> {
  if (IS_WEB) {
    return false;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    const existing = await getConnection(input.service);

    if (existing) {
      db.runSync(
        `UPDATE connections SET status = ?, sync_error = ?, connected_at = ?, last_sync_at = ? WHERE service = ?`,
        input.status,
        input.syncError ?? null,
        input.status === "connected" ? (existing.connectedAt?.getTime() ?? Date.now()) : null,
        input.status === "connected" ? Date.now() : null,
        input.service,
      );
    } else {
      db.runSync(
        `INSERT INTO connections (service, status, connected_at, last_sync_at, sync_error) VALUES (?, ?, ?, ?, ?)`,
        input.service,
        input.status,
        input.status === "connected" ? Date.now() : null,
        input.status === "connected" ? Date.now() : null,
        input.syncError ?? null,
      );
    }

    return true;
  } catch (error) {
    console.error(`Failed to update connection for ${input.service}:`, error);
    return false;
  }
}

export async function updateLastSync(service: ServiceType): Promise<boolean> {
  if (IS_WEB) {
    return false;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    db.runSync(
      `UPDATE connections SET last_sync_at = ?, sync_error = NULL WHERE service = ?`,
      Date.now(),
      service,
    );

    return true;
  } catch (error) {
    console.error(`Failed to update last sync for ${service}:`, error);
    return false;
  }
}

export async function setSyncError(service: ServiceType, error: string): Promise<boolean> {
  if (IS_WEB) {
    return false;
  }

  try {
    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    db.runSync(`UPDATE connections SET sync_error = ? WHERE service = ?`, error, service);

    return true;
  } catch (error) {
    console.error(`Failed to set sync error for ${service}:`, error);
    return false;
  }
}

export async function disconnectService(service: ServiceType): Promise<boolean> {
  if (IS_WEB) {
    return false;
  }

  try {
    await clearTokens(service);

    const SQLite = await import("expo-sqlite");
    const db = SQLite.openDatabaseSync(DATABASE_NAME);

    db.runSync(
      `UPDATE connections SET status = 'disconnected', connected_at = NULL, last_sync_at = NULL, sync_error = NULL WHERE service = ?`,
      service,
    );

    return true;
  } catch (error) {
    console.error(`Failed to disconnect ${service}:`, error);
    return false;
  }
}

export interface UseConnectionsResult {
  connections: ConnectionsState;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  disconnect: (service: ServiceType) => Promise<boolean>;
  isConnected: (service: ServiceType) => boolean;
}

export function useConnections(): UseConnectionsResult {
  const [connections, setConnections] = useState<ConnectionsState>({
    whoop: null,
    ticktick: null,
    strong: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load connections"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(
    async (service: ServiceType): Promise<boolean> => {
      const success = await disconnectService(service);
      if (success) {
        await refresh();
      }
      return success;
    },
    [refresh],
  );

  const isConnected = useCallback(
    (service: ServiceType): boolean => {
      return connections[service]?.status === "connected";
    },
    [connections],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    connections,
    isLoading,
    error,
    refresh,
    disconnect,
    isConnected,
  };
}
