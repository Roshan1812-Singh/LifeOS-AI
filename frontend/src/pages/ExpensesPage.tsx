import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useExpenseInsights,
  useExpenseSummary,
  useMonthly,
  useTransactions,
} from "@/hooks/useExpenses";
import type {
  ExpenseCategory,
  ExpenseType,
  MonthlyPoint,
  Transaction,
} from "@/types";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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

const INCOME_CATEGORIES: ExpenseCategory[] = [
  "SALARY",
  "BUSINESS",
  "INVESTMENT",
  "GIFT",
  "OTHER",
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  FOOD: "#ef4444",
  GROCERIES: "#f97316",
  TRAVEL: "#0ea5e9",
  SHOPPING: "#ec4899",
  BILLS: "#8b5cf6",
  RENT: "#6366f1",
  HEALTH: "#10b981",
  EDUCATION: "#14b8a6",
  ENTERTAINMENT: "#f59e0b",
  SALARY: "#22c55e",
  BUSINESS: "#3b82f6",
  INVESTMENT: "#a855f7",
  GIFT: "#d946ef",
  OTHER: "#64748b",
};

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function useMoney(currency: string) {
  return useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
    }
  }, [currency]);
}

function MonthlyChart({ data, currency }: { data: MonthlyPoint[]; currency: string }) {
  const money = useMoney(currency);
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));

  return (
    <div className="flex items-end gap-4 overflow-x-auto pb-2">
      {data.map((point) => (
        <div key={point.month} className="flex min-w-[44px] flex-1 flex-col items-center gap-2">
          <div className="flex h-40 items-end gap-1">
            <div
              className="w-3.5 rounded-t bg-emerald-500 transition-all"
              style={{ height: `${(point.income / max) * 100}%` }}
              title={`Income ${money.format(point.income)}`}
            />
            <div
              className="w-3.5 rounded-t bg-rose-500 transition-all"
              style={{ height: `${(point.expense / max) * 100}%` }}
              title={`Expense ${money.format(point.expense)}`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{point.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function TransactionRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const money = useMoney(tx.currency || currency);
  const del = useDeleteTransaction();
  const income = tx.type === "INCOME";

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}22` }}
      >
        {income ? (
          <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
        ) : (
          <ArrowDownCircle className="h-5 w-5 text-rose-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {label(tx.category)}
          {tx.note ? <span className="text-muted-foreground"> · {tx.note}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(tx.occurredOn).toLocaleDateString()}
        </p>
      </div>
      <span className={`text-sm font-semibold ${income ? "text-emerald-600" : "text-rose-600"}`}>
        {income ? "+" : "-"}
        {money.format(tx.amount)}
      </span>
      <Button variant="ghost" size="icon" aria-label="Delete transaction" onClick={() => del.mutate(tx.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ExpensesPage() {
  const [type, setType] = useState<ExpenseType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD");
  const [occurredOn, setOccurredOn] = useState(todayIso());
  const [note, setNote] = useState("");
  const [filterType, setFilterType] = useState<ExpenseType | "">("");

  const summary = useExpenseSummary();
  const monthly = useMonthly(6);
  const transactions = useTransactions(filterType ? { type: filterType } : {});
  const create = useCreateTransaction();
  const insights = useExpenseInsights();

  const currency = summary.data?.currency ?? "USD";
  const money = useMoney(currency);
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleType = (next: ExpenseType) => {
    setType(next);
    setCategory(next === "INCOME" ? "SALARY" : "FOOD");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    create.mutate(
      { type, amount: value, category, occurredOn, note: note.trim() || undefined, currency },
      {
        onSuccess: () => {
          setAmount("");
          setNote("");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader title="Expenses" icon={<Wallet className="h-5 w-5 text-primary" />}>
        <Button
          variant="secondary"
          onClick={() => insights.mutate()}
          disabled={insights.isPending}
        >
          {insights.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AI Insights
        </Button>
      </PageHeader>

      <div className="container space-y-6 py-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">
                {money.format(summary.data?.totalIncome ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-600">
                {money.format(summary.data?.totalExpense ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  (summary.data?.net ?? 0) >= 0 ? "text-foreground" : "text-rose-600"
                }`}
              >
                {money.format(summary.data?.net ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {insights.data && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Spending insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{insights.data.analysis}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Last 6 months</CardTitle>
            </CardHeader>
            <CardContent>
              {monthly.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <MonthlyChart data={monthly.data ?? []} currency={currency} />
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Income
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expense
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Where it goes (this month)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.data && summary.data.expenseByCategory.length > 0 ? (
                summary.data.expenseByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                        />
                        {label(c.category)}
                      </span>
                      <span className="text-muted-foreground">
                        {money.format(c.total)} · {c.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.percentage}%`,
                          backgroundColor: CATEGORY_COLORS[c.category],
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No expenses logged this month yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add transaction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <div className="flex rounded-md border p-0.5">
                  <button
                    type="button"
                    onClick={() => handleType("EXPENSE")}
                    className={`flex-1 rounded px-2 py-1.5 text-sm font-medium transition-colors ${
                      type === "EXPENSE" ? "bg-rose-500 text-white" : "text-muted-foreground"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleType("INCOME")}
                    className={`flex-1 rounded px-2 py-1.5 text-sm font-medium transition-colors ${
                      type === "INCOME" ? "bg-emerald-500 text-white" : "text-muted-foreground"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className={SELECT_CLASS}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {label(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={occurredOn}
                  onChange={(e) => setOccurredOn(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Lunch"
                  maxLength={500}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Transactions</CardTitle>
            <select
              className={`${SELECT_CLASS} h-9 w-auto`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ExpenseType | "")}
            >
              <option value="">All</option>
              <option value="EXPENSE">Expenses</option>
              <option value="INCOME">Income</option>
            </select>
          </CardHeader>
          <CardContent>
            {transactions.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.data?.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                <Wallet className="mx-auto mb-3 h-10 w-10" />
                <p>No transactions yet. Add your first one above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.data?.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} currency={currency} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
