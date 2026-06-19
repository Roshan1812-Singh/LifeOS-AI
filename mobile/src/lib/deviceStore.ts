import * as SecureStore from "expo-secure-store";

const EMAIL_KEY = "lifeos_device_email";
const PASSWORD_KEY = "lifeos_device_password";

export interface DeviceCredentials {
  email: string;
  password: string;
}

/**
 * Persists the per-device anonymous account credentials. There is no login UI;
 * the app silently registers one account for this device on first launch and
 * re-logs in with these on subsequent launches. They live only in the device's
 * secure storage, so reinstalling starts a fresh account (by design).
 */
export const deviceStore = {
  async get(): Promise<DeviceCredentials | null> {
    const [email, password] = await Promise.all([
      SecureStore.getItemAsync(EMAIL_KEY),
      SecureStore.getItemAsync(PASSWORD_KEY),
    ]);
    return email && password ? { email, password } : null;
  },

  async set(credentials: DeviceCredentials): Promise<void> {
    await SecureStore.setItemAsync(EMAIL_KEY, credentials.email);
    await SecureStore.setItemAsync(PASSWORD_KEY, credentials.password);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    await SecureStore.deleteItemAsync(PASSWORD_KEY);
  },
};

/**
 * Builds unique, validation-passing credentials for a new device account.
 * Email is a syntactically valid address; password satisfies the backend rule
 * (>= 8 chars with an upper case, lower case and a digit).
 */
export function generateDeviceCredentials(): DeviceCredentials {
  const rand = () => Math.random().toString(36).slice(2);
  const id = `${Date.now()}${rand()}`;
  return {
    email: `device-${id}@lifeos.app`,
    password: `Aa1${rand()}${rand()}`,
  };
}
