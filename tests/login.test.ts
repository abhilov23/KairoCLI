import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockHome = vi.hoisted(() => ({
  homeDir: `${process.env.TEMP ?? process.cwd()}\\kairo-login-${Date.now()}`,
}));

vi.mock("os", () => ({
  default: {
    homedir: () => mockHome.homeDir,
  },
}));

// Mock `open` so it doesn't try to open a browser
vi.mock("open", () => ({
  default: vi.fn(),
}));

describe("whoamiCommand", () => {
  beforeEach(async () => {
    // Clean up any leftover auth file before each test
    const { clearAuthSession } = await import("../config/authManager.js");
    await clearAuthSession();
  });

  it("should print not-authenticated message when no session exists", async () => {
    const { whoamiCommand } = await import("../core/login.js");
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await whoamiCommand();

    expect(logs.join(" ")).toContain("Not authenticated");
    spy.mockRestore();
  });

  it("should show user profile and session metadata when authenticated", async () => {
    const { saveAuthSession } = await import("../config/authManager.js");
    const { whoamiCommand } = await import("../core/login.js");

    await saveAuthSession({
      accessToken: "tok_test123",
      userProfile: { name: "Alice", email: "alice@example.com" },
      deviceCode: "dev_abc123",
      createdAt: "2026-06-09T12:00:00.000Z",
    });

    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await whoamiCommand();

    const output = logs.join(" ");
    expect(output).toContain("Alice");
    expect(output).toContain("alice@example.com");
    expect(output).toContain("Authenticated Session");
    expect(output).toContain("session info");
    spy.mockRestore();
  });

  it("should show session info even without user profile", async () => {
    const { saveAuthSession } = await import("../config/authManager.js");
    const { whoamiCommand } = await import("../core/login.js");

    await saveAuthSession({
      accessToken: "tok_no_profile",
      createdAt: "2026-06-09T12:00:00.000Z",
    });

    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await whoamiCommand();

    const output = logs.join(" ");
    expect(output).toContain("Authenticated Session");
    expect(output).toContain("session info");
    expect(output).toContain("2026"); // year is locale-independent
    spy.mockRestore();
  });

  it("should show device code snippet when available", async () => {
    const { saveAuthSession } = await import("../config/authManager.js");
    const { whoamiCommand } = await import("../core/login.js");

    await saveAuthSession({
      accessToken: "tok_device",
      userProfile: { name: "Bob" },
      deviceCode: "abcdef1234567890",
      createdAt: "2026-06-09T12:00:00.000Z",
    });

    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await whoamiCommand();

    const output = logs.join(" ");
    expect(output).toContain("abcdef123456");
    spy.mockRestore();
  });
});

describe("logoutCommand", () => {
  beforeEach(async () => {
    const { clearAuthSession } = await import("../config/authManager.js");
    await clearAuthSession();
  });

  it("should print not-logged-in message when no session exists", async () => {
    const { logoutCommand } = await import("../core/login.js");
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await logoutCommand();

    expect(logs.join(" ")).toContain("not logged in");
    spy.mockRestore();
  });

  it("should clear session and print success when logged in", async () => {
    const { saveAuthSession, loadAuthSession } =
      await import("../config/authManager.js");
    const { logoutCommand } = await import("../core/login.js");

    await saveAuthSession({
      accessToken: "tok_logout",
      userProfile: { name: "Charlie" },
      createdAt: "2026-06-09T12:00:00.000Z",
    });

    // Verify session exists
    await expect(loadAuthSession()).resolves.not.toBeNull();

    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    await logoutCommand();

    const output = logs.join(" ");
    expect(output).toContain("Logged out successfully");

    // Verify session is gone
    await expect(loadAuthSession()).resolves.toBeNull();
    spy.mockRestore();
  });
});

describe("loginCommand", () => {
  beforeEach(async () => {
    const { clearAuthSession } = await import("../config/authManager.js");
    await clearAuthSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("should complete the full device auth flow successfully", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              device_code: "dc_ok",
              user_code: "AAA-BBB",
              verification_uri: "http://localhost:3000/activate",
              interval: 0,
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              access_token: "tok_abc",
              jwt_token: "jwt_abc",
              user_profile: { name: "Test User", email: "test@example.com" },
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ id: "session-id-123" }),
        }),
      );

    vi.stubGlobal("fetch", mockFetch);
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    const { loginCommand } = await import("../core/login.js");
    const logs: string[] = [];
    const errLogs: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    const errSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => errLogs.push(args.join(" ")));

    const loginPromise = loginCommand();
    // Drain microtasks first so sleep gets queued, then fire the timer
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.advanceTimersByTimeAsync(0);
    await loginPromise;

    const output = logs.join(" ");
    expect(output).toContain("Pairing link complete");
    expect(errLogs).toHaveLength(0);

    // Verify auth session was saved with the JWT
    const { loadAuthSession } = await import("../config/authManager.js");
    const session = await loadAuthSession();
    expect(session).not.toBeNull();
    expect(session?.jwtToken).toBe("jwt_abc");
    expect(session?.accessToken).toBe("tok_abc");

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("should handle authorization_pending before success", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              device_code: "dc_pending",
              user_code: "CCC-DDD",
              verification_uri: "http://localhost:3000/activate",
              interval: 0,
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: "authorization_pending" }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              access_token: "tok_pending",
              user_profile: { name: "Pending User" },
            }),
        }),
      );

    vi.stubGlobal("fetch", mockFetch);
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    const { loginCommand } = await import("../core/login.js");
    const logs: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const loginPromise = loginCommand();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5_000);
    await loginPromise;

    const output = logs.join(" ");
    expect(output).toContain("Pairing link complete");
    logSpy.mockRestore();
  });

  it("should handle slow_down and retry successfully", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              device_code: "dc_slow",
              user_code: "EEE-FFF",
              verification_uri: "http://localhost:3000/activate",
              interval: 0,
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: "slow_down" }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              access_token: "tok_slow",
              user_profile: { name: "Slow User" },
            }),
        }),
      );

    vi.stubGlobal("fetch", mockFetch);
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    const { loginCommand } = await import("../core/login.js");
    const logs: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));

    const loginPromise = loginCommand();
    await vi.advanceTimersByTimeAsync(0);
    // slow_down increments interval by 5s, so need: 1s (first sleep) + 6s (second sleep) = 7s
    await vi.advanceTimersByTimeAsync(10_000);
    await loginPromise;

    const output = logs.join(" ");
    expect(output).toContain("Pairing link complete");
    logSpy.mockRestore();
  });

  it("should log error when fetch rejects (network error)", async () => {
    const mockFetch = vi.fn().mockImplementationOnce(() =>
      Promise.reject(new Error("net::ERR_CONNECTION_REFUSED")),
    );

    vi.stubGlobal("fetch", mockFetch);

    const { loginCommand } = await import("../core/login.js");
    const errLogs: string[] = [];
    const errSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => errLogs.push(args.join(" ")));

    await loginCommand();

    const errOutput = errLogs.join(" ");
    expect(errOutput).toContain("An error occurred during the login process");
    expect(errOutput).toContain("net::ERR_CONNECTION_REFUSED");
    errSpy.mockRestore();
  });

  it("should log error when device init fails", async () => {
    const mockFetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Server Error",
        json: () => Promise.resolve({ error: "Internal server error" }),
      }),
    );

    vi.stubGlobal("fetch", mockFetch);

    const { loginCommand } = await import("../core/login.js");
    const errLogs: string[] = [];
    const errSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => errLogs.push(args.join(" ")));

    await loginCommand();

    const errOutput = errLogs.join(" ");
    expect(errOutput).toContain("An error occurred during the login process");
    expect(errOutput).toContain("Failed to initiate device authentication");
    errSpy.mockRestore();
  });

  it("should log error when token polling returns unexpected response", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              device_code: "dc_err",
              user_code: "GGG-HHH",
              verification_uri: "http://localhost:3000/activate",
              interval: 0,
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}), // no access_token → unexpected error
        }),
      );

    vi.stubGlobal("fetch", mockFetch);
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    const { loginCommand } = await import("../core/login.js");
    const errLogs: string[] = [];
    const errSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => errLogs.push(args.join(" ")));

    const loginPromise = loginCommand();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5_000);
    await loginPromise;

    const errOutput = errLogs.join(" ");
    expect(errOutput).toContain("An error occurred during the login process");
    expect(errOutput).toContain("Handshake context dropped natively.");
    errSpy.mockRestore();
  });
});
