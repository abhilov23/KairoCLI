import fs from "fs/promises";
import path from "path";
import { describe, it, expect, vi } from "vitest";

const mockHome = vi.hoisted(() => ({
  homeDir: `${process.env.TEMP ?? process.cwd()}\\kairo-auth-${Date.now()}`,
}));

vi.mock("os", () => ({
  default: {
    homedir: () => mockHome.homeDir,
  },
}));

describe("authManager", () => {
  it("should save and load an auth session", async () => {
    const { getAuthFile, saveAuthSession, loadAuthSession } = await import(
      "../config/authManager.js"
    );

    const session = {
      accessToken: "token-123",
      userProfile: { id: "user_1", name: "Kairo" },
      deviceCode: "device-456",
      createdAt: "2026-06-07T00:00:00.000Z",
    };

    await saveAuthSession(session);

    const raw = await fs.readFile(getAuthFile(), "utf-8");
    expect(JSON.parse(raw)).toEqual(session);
    await expect(loadAuthSession()).resolves.toEqual(session);
  });

  describe("clearAuthSession", () => {
    it("should delete the auth file and return true when it exists", async () => {
      const { getAuthFile, saveAuthSession, clearAuthSession } =
        await import("../config/authManager.js");

      // First save a session so the file exists
      await saveAuthSession({
        accessToken: "token-to-clear",
        userProfile: { name: "Test" },
        createdAt: "2026-06-07T00:00:00.000Z",
      });

      // Verify the file exists
      await expect(fs.access(getAuthFile())).resolves.toBeUndefined();

      // Clear it
      const result = await clearAuthSession();
      expect(result).toBe(true);

      // Verify it's gone
      await expect(fs.access(getAuthFile())).rejects.toThrow();
    });

    it("should return false when the auth file does not exist", async () => {
      const { clearAuthSession } = await import("../config/authManager.js");

      // No session saved, file shouldn't exist
      const result = await clearAuthSession();
      expect(result).toBe(false);
    });
  });
});
