import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/store/authStore";
import { useCurrencyStore } from "./src/store/currencyStore";
import { useI18nStore } from "./src/i18n";
import { warmUpBackend } from "./src/services/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const hydrateCurrency = useCurrencyStore((s) => s.hydrate);
  const hydrateLanguage = useI18nStore((s) => s.hydrate);

  useEffect(() => {
    // Wake the free-tier backend first so the silent device sign-in below
    // doesn't hit a cold-start timeout, then establish the session.
    warmUpBackend();
    hydrateCurrency();
    hydrateLanguage();
    bootstrap();
  }, [bootstrap, hydrateCurrency, hydrateLanguage]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
