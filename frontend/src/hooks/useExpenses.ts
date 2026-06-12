import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  expenseService,
  type ListFilters,
  type TransactionInput,
} from "@/services/expenseService";
import { extractErrorMessage } from "@/services/api";

export function useTransactions(filters: ListFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => expenseService.list(filters),
  });
}

export function useExpenseSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ["expense-summary", from, to],
    queryFn: () => expenseService.summary(from, to),
  });
}

export function useMonthly(months = 6) {
  return useQuery({
    queryKey: ["expense-monthly", months],
    queryFn: () => expenseService.monthly(months),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["expense-summary"] });
  qc.invalidateQueries({ queryKey: ["expense-monthly"] });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => expenseService.create(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Transaction saved");
    },
    onError: (e) => toast.error(extractErrorMessage(e, "Could not save transaction")),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: () => invalidateAll(qc),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not delete transaction")),
  });
}

export function useExpenseInsights() {
  return useMutation({
    mutationFn: () => expenseService.insights(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not generate insights")),
  });
}
