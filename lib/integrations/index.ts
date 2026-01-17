export * from "./auth";
export * from "./connection-manager";
export * from "./strong";

// Whoop exports with namespaced sync functions
export {
  WHOOP_AUTH_URL,
  WHOOP_TOKEN_URL,
  WHOOP_SCOPES,
  getWhoopRedirectUri,
  exchangeWhoopCode,
  type ExchangeResult,
  syncWhoopData,
  type SyncWhoopResult,
  triggerDebouncedSync as triggerWhoopDebouncedSync,
  isSyncing as isWhoopSyncing,
} from "./whoop";

// TickTick exports with namespaced sync functions
export {
  TICKTICK_AUTH_URL,
  TICKTICK_TOKEN_URL,
  TICKTICK_SCOPES,
  getTickTickRedirectUri,
  exchangeTickTickCode,
  fetchTickTickProjects,
  fetchTickTickTasks,
  createTickTickTask,
  updateTickTickTask,
  completeTickTickTask,
  uncompleteTickTickTask,
  type TickTickProject,
  type TickTickTask,
  ticktickPriorityToApp,
  appPriorityToTickTick,
  syncTickTickTasks,
  type SyncResult as TickTickSyncResult,
  type TickTickMetadata,
  triggerDebouncedSync as triggerTickTickDebouncedSync,
  isSyncing as isTickTickSyncing,
} from "./ticktick";
