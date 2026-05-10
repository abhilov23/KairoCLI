import promptSync from "prompt-sync";
import path from "path";

const dangerousPatterns = [
  // Cross-platform destructive deletes
  /\brm\b/i,
  /\brm\s+-rf\b/i,
  /\brmdir\b/i,
  /\bmv\b.+\s+\/dev\/null\b/i,
  /\bdel\b/i,
  /\bdel\s+\/(s|q|f)/i,
  /\berase\b/i,
  /\bremove-item\b/i,
  /\bremove-item\b.+-(recurse|force)/i,
  /\bri\b/i,
  /\bri\b.+-(recurse|force)/i,
  /\bunlink\b/i,
  /\btruncate\b.+-s\s+0\b/i,
  /\bshred\b/i,
  /\bdd\b.+\bof=\/dev\/(sda|disk|nvme)/i,
  /\bmkfs(\.\w+)?\b/i,

  // Windows system-impacting commands
  /\bformat\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\brestart-computer\b/i,
  /\bstop-computer\b/i,
  /\breg\s+delete\b/i,
  /\bbcdedit\b/i,
  /\bcipher\s+\/w\b/i,
  /\btakeown\b/i,
  /\bicacls\b.+\/grant/i,
  /\bsc\s+delete\b/i,

  // Linux/macOS system-impacting commands
  /\bsudo\b/i,
  /\bchown\b.+\s+\/\b/i,
  /\bchmod\b.+\s+\/\b/i,
  /\bkillall\b/i,
  /\bpkill\b/i,
  /\blaunchctl\s+unload\b/i,
  /\bsystemctl\s+(stop|disable|mask)\b/i,

  // Git destructive operations
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-f/i,
  /\bgit\s+checkout\s+--\b/i,
  /\bgit\s+restore\b.+(--staged|--worktree)/i,
];

const protectedFiles = [".env", "package.json", "pnpm-lock.yaml"];

export function isDangerousCommand(command: string): boolean {
  const normalized = command.trim();

  if (!normalized) {
    return true;
  }

  return dangerousPatterns.some((pattern) => pattern.test(normalized));
}

export function isProtectedFile(filePath: string): boolean {
  const normalizedPath = filePath.toLowerCase();
  const baseName = path.basename(normalizedPath);

  return protectedFiles.some(
    (file) => normalizedPath.includes(file) || baseName === file
  );
}

const prompt = promptSync();

export function askConfirmation(message: string): boolean {
  console.log(message);
  const answer = prompt("Continue? (y/n): ");

  const normalized = answer.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}
