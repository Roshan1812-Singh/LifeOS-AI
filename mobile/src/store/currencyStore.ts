import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const CURRENCY_KEY = "lifeos_currency";
export const DEFAULT_CURRENCY = "USD";

export interface CurrencyOption {
  code: string;
  label: string;
}

// Common currencies the user can pick from. Amounts are formatted with
// Intl.NumberFormat, so the correct symbol (₹, £, €, …) is rendered per code.
export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "USD $" },
  { code: "INR", label: "INR ₹" },
  { code: "GBP", label: "GBP £" },
  { code: "EUR", label: "EUR €" },
  { code: "JPY", label: "JPY ¥" },
  { code: "AUD", label: "AUD A$" },
  { code: "CAD", label: "CAD C$" },
  { code: "AED", label: "AED د.إ" },
  { code: "SGD", label: "SGD S$" },
];

interface CurrencyState {
  currency: string;
  hydrated: boolean;
  setCurrency: (code: string) => void;
  hydrate: () => Promise<void>;
}

/**
 * The user's preferred display/entry currency, persisted on-device so it sticks
 * across launches and is shared by the Home and Expenses screens.
 */
export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: DEFAULT_CURRENCY,
  hydrated: false,

  setCurrency: (code) => {
    set({ currency: code });
    SecureStore.setItemAsync(CURRENCY_KEY, code).catch(() => {});
  },

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(CURRENCY_KEY);
      if (saved) set({ currency: saved });
    } catch {
      // ignore – fall back to the default currency
    } finally {
      set({ hydrated: true });
    }
  },
}));

export function useCurrency() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  return { currency, setCurrency };
}
