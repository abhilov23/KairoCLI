export type ExecutionState = {
  turnCount: number;
  lastToolName: string | null;
  lastError: string | null;
  lastUpdatedAt: string;
};

export function createInitialExecutionState(): ExecutionState {
  return {
    turnCount: 0,
    lastToolName: null,
    lastError: null,
    lastUpdatedAt: new Date().toISOString(),
  };
}
