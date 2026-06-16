import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/store/authStore";
import { useCurrencyStore } from "./src/store/currencyStore";

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
