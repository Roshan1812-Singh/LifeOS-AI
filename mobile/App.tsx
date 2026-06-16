import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/store/authStore";
import { useCurrencyStore } from "./src/store/currencyStore";
import { warmUpBackend } from "./src/services/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateCurrency = useCurrencyStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateCurrency();
    // Wake the free-tier backend right away so it's warm by the time the user
    // signs in (avoids the first-request cold-start "Network error").
    warmUpBackend();
  }, [hydrate, hydrateCurrency]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
