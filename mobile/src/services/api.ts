import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "../config";
import { useAuthStore } from "../store/authStore";
import type { AuthResponse } from "../types";

interface ApiErrorBody {
  message?: string;
  fieldErrors?: { field: string; message: string }[];
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Render's free tier sleeps after idle; the first request must wait for a cold
  // start (typically 30-60s). 20s wasn't enough, so the first login on the phone
  // failed with a "Network error". Give the server room to wake up.
  timeout: 90000,
});

/**
 * Wakes the (free-tier) backend as early as possible so it is warm by the time
 * the user signs in. Fire-and-forget; failures are ignored. Hits the health
 * endpoint which lives at the origin root, not under /api.
 */
export async function warmUpBackend(): Promise<void> {
  try {
    const origin = API_URL.replace(/\/api\/?$/, "");
    await axios.get(`${origin}/actuator/health`, { timeout: 90000 });
  } catch {
    // best effort – the real request will wake it if this one didn't
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const store = useAuthStore.getState();

    const isAuthEndpoint = original?.url?.includes("/auth/");
    if (status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = store.refreshToken;
    if (!refreshToken) {
      await store.clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      await useAuthStore.getState().setSession(data);
      flushQueue(null, data.accessToken);
      original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      await useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function extractErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.fieldErrors?.length) {
      return body.fieldErrors.map((f) => f.message).join(", ");
    }
    if (body?.message) {
      return body.message;
    }
    // No response means we never reached the server (timeout / cold start / no
    // connectivity). Give an actionable hint instead of a raw "Network Error".
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "The server is taking a while to wake up. Please wait a few seconds and try again.";
      }
      return "Can't reach the server. It may be waking up — wait a moment and try again.";
    }
    return error.message ?? fallback;
  }
  return fallback;
}
