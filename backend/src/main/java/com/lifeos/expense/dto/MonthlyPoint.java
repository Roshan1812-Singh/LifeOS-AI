package com.lifeos.expense.dto;

import java.math.BigDecimal;

public record MonthlyPoint(
        String month,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal net
) {
}
