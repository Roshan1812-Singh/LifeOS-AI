import { create } from "zustand";
import { tokenStore } from "../lib/tokenStore";
import type { AuthResponse, User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setSession: (auth: AuthResponse) => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  setSession: async (auth) => {
    await tokenStore.set(auth.accessToken, auth.refreshToken);
    set({
      user: auth.user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      tokenStore.getAccess(),
      tokenStore.getRefresh(),
    ]);
    set({ accessToken, refreshToken, hydrated: true });
  },

  clear: async () => {
    await tokenStore.clear();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
