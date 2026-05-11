export type WorkspaceState = {
  cwd: string;
  lastUpdatedAt: string;
};

export function createInitialWorkspaceState(): WorkspaceState {
  return {
    cwd: process.cwd(),
    lastUpdatedAt: new Date().toISOString(),
  };
}
