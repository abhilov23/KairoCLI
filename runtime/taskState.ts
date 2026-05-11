export type TaskStatus =
  | "idle"
  | "in_progress"
  | "blocked"
  | "done";

export type TaskState = {
  currentTask: string | null;
  status: TaskStatus;
  lastUpdatedAt: string;
};

export function createInitialTaskState(): TaskState {
  return {
    currentTask: null,
    status: "idle",
    lastUpdatedAt: new Date().toISOString(),
  };
}
