package com.lifeos.expense.dto;

import com.lifeos.expense.domain.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SummaryResponse(
        LocalDate from,
        LocalDate to,
        String currency,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal net,
        long transactionCount,
        ExpenseCategory topExpenseCategory,
        List<CategoryBreakdown> expenseByCategory
) {
}
