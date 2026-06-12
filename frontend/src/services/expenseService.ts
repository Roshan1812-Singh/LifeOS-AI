import { api } from "./api";
import type {
  ExpenseCategory,
  ExpenseInsights,
  ExpenseSummary,
  ExpenseType,
  MonthlyPoint,
  Transaction,
} from "@/types";

export interface TransactionInput {
  type: ExpenseType;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  note?: string;
  occurredOn: string;
}

export interface ListFilters {
  type?: ExpenseType;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
}

export const expenseService = {
  async list(filters: ListFilters = {}): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>("/expenses", { params: filters });
    return data;
  },

  async create(input: TransactionInput): Promise<Transaction> {
    const { data } = await api.post<Transaction>("/expenses", input);
    return data;
  },

  async update(id: string, input: TransactionInput): Promise<Transaction> {
    const { data } = await api.put<Transaction>(`/expenses/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async summary(from?: string, to?: string): Promise<ExpenseSummary> {
    const { data } = await api.get<ExpenseSummary>("/expenses/summary", { params: { from, to } });
    return data;
  },

  async monthly(months = 6): Promise<MonthlyPoint[]> {
    const { data } = await api.get<MonthlyPoint[]>("/expenses/monthly", { params: { months } });
    return data;
  },

  async insights(): Promise<ExpenseInsights> {
    const { data } = await api.post<ExpenseInsights>("/expenses/insights");
    return data;
  },
};
