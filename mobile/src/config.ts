import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the backend base URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL (set in .env / EAS env) — use this for real deployments.
 *  2. When running via Expo on a physical device, reuse the Metro host LAN IP and
 *     talk to the backend on port 8080 (assumes backend runs on the same machine).
 *  3. Android emulator maps the host loopback to 10.0.2.2.
 *  4. Fallback to localhost (iOS simulator / web).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, "");
  }

  const legacyManifest = Constants as unknown as {
    manifest?: { debuggerHost?: string };
  };
  const hostUri = Constants.expoConfig?.hostUri ?? legacyManifest.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8080/api`;
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api";
  }
  return "http://localhost:8080/api";
}

export const API_URL = resolveApiUrl();

export const APP_NAME = "LifeOS AI";
