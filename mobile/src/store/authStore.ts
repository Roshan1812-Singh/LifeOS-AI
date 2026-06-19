import { create } from "zustand";
import { tokenStore } from "../lib/tokenStore";
import { deviceStore, generateDeviceCredentials } from "../lib/deviceStore";
import { authService } from "../services/auth";
import type { AuthResponse, User } from "../types";

export type AuthStatus = "loading" | "ready" | "error";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setSession: (auth: AuthResponse) => Promise<void>;
  setUser: (user: User) => void;
  /** Silently establishes a per-device session (no login UI). */
  bootstrap: () => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "loading",

  setSession: async (auth) => {
    await tokenStore.set(auth.accessToken, auth.refreshToken);
    set({
      user: auth.user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    });
  },

  setUser: (user) => set({ user }),

  bootstrap: async () => {
    set({ status: "loading" });
    try {
      // 1. Reuse a stored session if present (interceptor refreshes as needed).
      const [accessToken, refreshToken] = await Promise.all([
        tokenStore.getAccess(),
        tokenStore.getRefresh(),
      ]);
      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken, status: "ready" });
        return;
      }

      // 2. Log in with this device's saved credentials.
      const existing = await deviceStore.get();
      if (existing) {
        const auth = await authService.login(existing);
        await get().setSession(auth);
        set({ status: "ready" });
        return;
      }

      // 3. First launch on this device: create a private anonymous account.
      const credentials = generateDeviceCredentials();
      const auth = await authService.register({
        name: "My LifeOS",
        email: credentials.email,
        password: credentials.password,
      });
      await deviceStore.set(credentials);
      await get().setSession(auth);
      set({ status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  clear: async () => {
    await tokenStore.clear();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
