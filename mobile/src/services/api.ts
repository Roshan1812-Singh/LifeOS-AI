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
  timeout: 20000,
});

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
    return body?.message ?? error.message ?? fallback;
  }
  return fallback;
}
