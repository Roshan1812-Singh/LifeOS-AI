package com.lifeos.expense.dto;

import com.lifeos.expense.domain.ExpenseCategory;
import com.lifeos.expense.domain.ExpenseType;
import com.lifeos.expense.domain.Transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        ExpenseType type,
        BigDecimal amount,
        String currency,
        ExpenseCategory category,
        String note,
        LocalDate occurredOn,
        Instant createdAt
) {
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(t.getPublicId(), t.getType(), t.getAmount(), t.getCurrency(),
                t.getCategory(), t.getNote(), t.getOccurredOn(), t.getCreatedAt());
    }
}
