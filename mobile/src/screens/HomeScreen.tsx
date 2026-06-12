import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Card } from "../components/ui";
import { authService } from "../services/auth";
import { expenseService } from "../services/expenses";
import { useAuthStore } from "../store/authStore";
import { registerForPushNotificationsAsync } from "../native/notifications";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList, TabParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function HomeScreen({ navigation }: Props) {
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const me = await authService.me();
      setUser(me);
      return me;
    },
    initialData: storedUser ?? undefined,
  });

  const summary = useQuery({ queryKey: ["expense-summary"], queryFn: () => expenseService.summary() });

  useEffect(() => {
    registerForPushNotificationsAsync().then(setPushToken).catch(() => setPushToken(null));
  }, []);

  const firstName = profile.data?.name?.split(" ")[0] ?? "there";

  const shortcuts: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { label: "Assistant", icon: "sparkles-outline", onPress: () => navigation.navigate("Assistant") },
    { label: "Tasks", icon: "checkbox-outline", onPress: () => navigation.navigate("Tasks") },
    { label: "Expenses", icon: "wallet-outline", onPress: () => navigation.navigate("Expenses") },
    { label: "Documents", icon: "document-text-outline", onPress: () => navigation.navigate("Documents") },
    { label: "Reminders", icon: "notifications-outline", onPress: () => navigation.navigate("Reminders") },
  ];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hi {firstName}</Text>
      <Text style={styles.subtitle}>Welcome back to your AI workspace.</Text>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>This month</Text>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.miniLabel}>Income</Text>
            <Text style={[styles.miniValue, { color: colors.income }]}>
              {money(summary.data?.totalIncome ?? 0, summary.data?.currency ?? "USD")}
            </Text>
          </View>
          <View>
            <Text style={styles.miniLabel}>Expense</Text>
            <Text style={[styles.miniValue, { color: colors.expense }]}>
              {money(summary.data?.totalExpense ?? 0, summary.data?.currency ?? "USD")}
            </Text>
          </View>
          <View>
            <Text style={styles.miniLabel}>Net</Text>
            <Text style={styles.miniValue}>
              {money(summary.data?.net ?? 0, summary.data?.currency ?? "USD")}
            </Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Quick access</Text>
      <View style={styles.grid}>
        {shortcuts.map((s) => (
          <TouchableOpacity key={s.label} style={styles.shortcut} onPress={s.onPress}>
            <Ionicons name={s.icon} size={26} color={colors.primary} />
            <Text style={styles.shortcutText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={{ gap: spacing.sm }}>
        <View style={styles.pushRow}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          <Text style={styles.pushTitle}>Push notifications</Text>
        </View>
        <Text style={styles.pushStatus}>
          {pushToken
            ? "Enabled on this device. Reminders can be delivered as notifications."
            : "Not registered yet (needs a physical device and granted permission)."}
        </Text>
      </Card>

      <Button title="Log out" variant="secondary" onPress={() => useAuthStore.getState().clear()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  greeting: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.muted, marginTop: -spacing.sm },
  balanceCard: { gap: spacing.md, backgroundColor: colors.primary },
  balanceLabel: { color: "#c7d2fe", fontWeight: "600" },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  miniLabel: { color: "#e0e7ff", fontSize: 12 },
  miniValue: { color: colors.primaryText, fontSize: 18, fontWeight: "700", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  shortcut: {
    width: "30%",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  shortcutText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  pushRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pushTitle: { fontWeight: "700", color: colors.text },
  pushStatus: { color: colors.muted, fontSize: 13 },
});
