package com.lifeos.expense.dto;

import com.lifeos.expense.domain.ExpenseCategory;
import com.lifeos.expense.domain.ExpenseType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull ExpenseType type,

        @NotNull
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 13, fraction = 2, message = "Amount has too many digits")
        BigDecimal amount,

        @Size(max = 8) String currency,

        @NotNull ExpenseCategory category,

        @Size(max = 500) String note,

        @NotNull LocalDate occurredOn
) {
}
