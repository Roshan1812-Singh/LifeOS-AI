import { api } from "./api";
import type {
  ExpenseCategory,
  ExpenseInsights,
  ExpenseSummary,
  ExpenseType,
  Transaction,
} from "../types";

export interface TransactionInput {
  type: ExpenseType;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  note?: string;
  occurredOn: string;
}

export const expenseService = {
  async list(params: { type?: ExpenseType } = {}): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>("/expenses", { params });
    return data;
  },

  async create(input: TransactionInput): Promise<Transaction> {
    const { data } = await api.post<Transaction>("/expenses", input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async summary(): Promise<ExpenseSummary> {
    const { data } = await api.get<ExpenseSummary>("/expenses/summary");
    return data;
  },

  async insights(): Promise<ExpenseInsights> {
    const { data } = await api.post<ExpenseInsights>("/expenses/insights");
    return data;
  },
};
