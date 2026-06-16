import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, KeyboardAware } from "../components/ui";
import { expenseService } from "../services/expenses";
import { extractErrorMessage } from "../services/api";
import { CURRENCIES, useCurrency } from "../store/currencyStore";
import { colors, radius, spacing } from "../theme";
import type { ExpenseCategory, ExpenseType } from "../types";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "FOOD",
  "GROCERIES",
  "TRAVEL",
  "SHOPPING",
  "BILLS",
  "RENT",
  "HEALTH",
  "EDUCATION",
  "ENTERTAINMENT",
  "OTHER",
];
const INCOME_CATEGORIES: ExpenseCategory[] = ["SALARY", "BUSINESS", "INVESTMENT", "GIFT", "OTHER"];

function label(v: string) {
  return v.charAt(0) + v.slice(1).toLowerCase();
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function ExpensesScreen() {
  const qc = useQueryClient();
  const [type, setType] = useState<ExpenseType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD");
  const [note, setNote] = useState("");
  const [insight, setInsight] = useState<string | null>(null);

  const { currency, setCurrency } = useCurrency();
  const summary = useQuery({ queryKey: ["expense-summary"], queryFn: () => expenseService.summary() });
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["expense-summary"] });

  const create = useMutation({
    mutationFn: () =>
      expenseService.create({
        type,
        amount: Number(amount),
        category,
        note: note.trim() || undefined,
        currency,
        occurredOn: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      setAmount("");
      setNote("");
      invalidate();
    },
  });

  const insights = useMutation({
    mutationFn: () => expenseService.insights(),
    onSuccess: (r) => setInsight(r.analysis),
    onError: (e) => setInsight(extractErrorMessage(e, "Could not generate insights")),
  });

  const setKind = (k: ExpenseType) => {
    setType(k);
    setCategory(k === "INCOME" ? "SALARY" : "FOOD");
  };

  const submit = () => {
    if (!Number(amount) || Number(amount) <= 0) return;
    create.mutate();
  };

  return (
    <KeyboardAware>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.currencyRow}>
        <Text style={styles.currencyLabel}>Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c.code}
              style={[styles.chip, currency === c.code && styles.chipActive]}
              onPress={() => setCurrency(c.code)}
            >
              <Text style={[styles.chipText, currency === c.code && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>
            {money(summary.data?.totalIncome ?? 0, currency)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>
            {money(summary.data?.totalExpense ?? 0, currency)}
          </Text>
        </Card>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Text style={styles.cardTitle}>Where it goes (this month)</Text>
        {summary.data && summary.data.expenseByCategory.length > 0 ? (
          summary.data.expenseByCategory.map((c) => (
            <View key={c.category} style={{ gap: 4 }}>
              <View style={styles.breakRow}>
                <Text style={styles.breakLabel}>{label(c.category)}</Text>
                <Text style={styles.breakValue}>
                  {money(c.total, currency)} · {c.percentage}%
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(c.percentage, 2)}%` }]} />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No expenses logged this month yet.</Text>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Text style={styles.cardTitle}>Add transaction</Text>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, type === "EXPENSE" && { backgroundColor: colors.expense }]}
            onPress={() => setKind("EXPENSE")}
          >
            <Text style={[styles.toggleText, type === "EXPENSE" && styles.toggleTextActive]}>Expense</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, type === "INCOME" && { backgroundColor: colors.income }]}
            onPress={() => setKind("INCOME")}
          >
            <Text style={[styles.toggleText, type === "INCOME" && styles.toggleTextActive]}>Income</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Amount"
          placeholderTextColor={colors.muted}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{label(c)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Note (optional)"
          placeholderTextColor={colors.muted}
        />
        <Button title="Add" onPress={submit} loading={create.isPending} disabled={!Number(amount)} />
      </Card>

      <Button
        title="Get AI spending insights"
        variant="secondary"
        onPress={() => insights.mutate()}
        loading={insights.isPending}
      />
      {insight ? (
        <Card style={{ gap: spacing.sm, borderColor: colors.primary }}>
          <View style={styles.breakRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}> Spending insights</Text>
          </View>
          <Text style={styles.insightText}>{insight}</Text>
        </Card>
      ) : null}
      </ScrollView>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  currencyRow: { gap: spacing.sm },
  currencyLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  summaryRow: { flexDirection: "row", gap: spacing.md },
  summaryCard: { flex: 1, gap: spacing.xs },
  summaryLabel: { color: colors.muted, fontSize: 13 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  breakRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  breakLabel: { color: colors.text, fontWeight: "500" },
  breakValue: { color: colors.muted, fontSize: 13 },
  barTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.secondary, overflow: "hidden" },
  barFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  muted: { color: colors.muted },
  toggle: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 3, gap: 3 },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
  toggleText: { fontWeight: "600", color: colors.muted },
  toggleTextActive: { color: colors.primaryText },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.card,
  },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.primaryText, fontWeight: "600" },
  insightText: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
