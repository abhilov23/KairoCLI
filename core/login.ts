import open from "open";

import { saveAuthSession, loadAuthSession, clearAuthSession } from "../config/authManager.js";
import { syncSession } from "./syncSessions.js";

const LOCALHOST_API = "http://localhost:3000/api/auth/device";
const TOKEN_API = "http://localhost:3000/api/auth/device/token";
const AUTH_WEBSITE="http://localhost:3000/";


type DeviceInitResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  interval?: number;
};

type DeviceTokenResponse = {
  access_token?: string;
  jwt_token?: string;
  error?: string;
  error_description?: string;
  user_profile?: unknown;
};

export async function loginCommand() {
  console.log("🔄 Opening secure local authentication stream pipeline...");

  try {
    const initResponse = await fetch(LOCALHOST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!initResponse.ok) {
      throw new Error(
        `Failed to initiate device authentication: ${initResponse.statusText}`,
      );
    }

    const { device_code, user_code, verification_uri, interval } =
      (await initResponse.json()) as DeviceInitResponse;

    console.log("\n=============================================");
    console.log(`  YOUR PAIRING CODE: \x1b[1m\x1b[35m${user_code}\x1b[0m`);
    console.log("=============================================\n");
    console.log(`Routing activation page context: ${verification_uri}`);

    await open(verification_uri);

    console.log("⏳ Waiting for authentication confirmation...");

    await handleCliTokenPoll(device_code, interval);
  } catch (error) {
    console.error("❌ An error occurred during the login process:", error);
  }
}

async function handleCliTokenPoll(
  deviceCode: string,
  pollIntervalSeconds: number | undefined,
) {
  let currentIntervalSeconds = Math.max(1, Math.floor(pollIntervalSeconds ?? 5));

  while (true) {
    await sleep(currentIntervalSeconds * 1000);

    const response = await fetch(TOKEN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    const data = await parseJson<DeviceTokenResponse>(response);

    if (response.status === 400 && data.error === "authorization_pending") {
      process.stdout.write("⏳ Waiting for authorization completion in browser...\r");
      continue;
    }

    if (response.status === 400 && data.error === "slow_down") {
      currentIntervalSeconds += 5;
      continue;
    }

    if (response.status === 200 && data.access_token) {
      process.stdout.write("\n");
      await saveAuthSession({
        accessToken: data.access_token,
        jwtToken: data.jwt_token,
        userProfile: data.user_profile,
        deviceCode,
        createdAt: new Date().toISOString(),
      });

      process.stdout.write("\n");
      console.log(
        "✨ \x1b[32mPairing link complete!\x1b[0m Auth session cached successfully.",
      );
      printUserProfile(data.user_profile);

      // Push a login session to the website dashboard and store its ID
      const sessionId = await syncSession({
        provider: "cli-login",
        model: "N/A",
        tokenCount: 0,
        title: `Kairo CLI Login — ${deviceCode.substring(0, 12)}...`,
        workspace: process.cwd(),
      });
      if (sessionId) {
        console.log("  \x1b[2m✓ Session synced to dashboard.\x1b[0m");
        await saveAuthSession({
          accessToken: data.access_token,
          jwtToken: data.jwt_token,
          userProfile: data.user_profile,
          deviceCode,
          createdAt: new Date().toISOString(),
          loginSessionId: sessionId,
        });
      }

      return;
    }

    throw new Error(data.error_description || "Handshake context dropped natively.");
  }
}

function printUserProfile(
  profile: unknown,
  extraLines?: () => void,
) {
  if (!profile || typeof profile !== "object") {
    // Still show extra content (e.g. session metadata) even without profile
    if (extraLines) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("  \x1b[36mAuthenticated Session\x1b[0m");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      extraLines();
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }
    return;
  }

  const p = profile as Record<string, unknown>;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  \x1b[36mAuthenticated Session\x1b[0m");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Whitelist of known displayable fields
  const displayFields: [string, string][] = [
    ["name", "Name"],
    ["displayName", "Display name"],
    ["username", "Username"],
    ["email", "Email"],
  ];

  for (const [key, label] of displayFields) {
    const val = p[key];
    if (typeof val === "string" && val.trim()) {
      console.log(`  \x1b[1m${label}:\x1b[0m${label.length < 12 ? "       " : "      "}${val}`);
    }
  }

  // Avatar as URL
  const avatar = p.avatar || p.picture || "";
  const avatarStr = typeof avatar === "string" ? avatar : "";
  if (avatarStr) {
    const display =
      avatarStr.length > 60 ? avatarStr.substring(0, 60) + "..." : avatarStr;
    console.log(`  \x1b[1mAvatar:\x1b[0m      ${display}`);
  }

  // Extra content inside the box (e.g. session metadata from /whoami)
  if (extraLines) {
    console.log("");
    extraLines();
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function logoutCommand() {
  const session = await loadAuthSession();

  if (!session) {
    console.log("\n🔓 \x1b[33mYou're not logged in.\x1b[0m Nothing to clear.\n");
    return;
  }

  // Delete login sessions from DB first, then revoke the token
  // (token must still be valid for the sessions request)
  const token = session.jwtToken ?? session.accessToken;
  if (token) {
    try {
      const url = session.loginSessionId
        ? `${AUTH_WEBSITE}api/sessions?id=${session.loginSessionId}`
        : `${AUTH_WEBSITE}api/sessions`;
      await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Network failure — still clear locally
    }

    try {
      await fetch(`${AUTH_WEBSITE}api/auth/cli-session`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Network failure — still clear locally
    }
  }

  const cleared = await clearAuthSession();
  if (cleared) {
    console.log("\n👋 \x1b[32mLogged out successfully.\x1b[0m Auth session cleared.\n");
  } else {
    console.log("\n⚠️  \x1b[33mCould not clear auth session file.\x1b[0m\n");
  }
}

export async function whoamiCommand() {
  const session = await loadAuthSession();

  if (!session) {
    console.log("\n🔓 \x1b[33mNot authenticated.\x1b[0m Run \x1b[1m/login\x1b[0m to sign in.\n");
    return;
  }

  printUserProfile(session.userProfile, () => {
    console.log("  \x1b[2m── session info ──\x1b[0m");
    if (session.createdAt) {
      const date = new Date(session.createdAt);
      console.log(`  \x1b[1mLogged in at:\x1b[0m ${date.toLocaleString()}`);
    }
    if (session.deviceCode) {
      console.log(`  \x1b[1mDevice code:\x1b[0m  ${session.deviceCode.substring(0, 12)}...`);
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
