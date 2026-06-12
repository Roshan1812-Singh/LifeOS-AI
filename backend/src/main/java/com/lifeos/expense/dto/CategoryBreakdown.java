package com.lifeos.expense.dto;

import com.lifeos.expense.domain.ExpenseCategory;

import java.math.BigDecimal;

public record CategoryBreakdown(
        ExpenseCategory category,
        BigDecimal total,
        double percentage
) {
}
