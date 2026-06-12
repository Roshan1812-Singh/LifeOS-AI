package com.lifeos.expense.web;

import com.lifeos.expense.domain.ExpenseCategory;
import com.lifeos.expense.domain.ExpenseType;
import com.lifeos.expense.dto.InsightsResponse;
import com.lifeos.expense.dto.MonthlyPoint;
import com.lifeos.expense.dto.SummaryResponse;
import com.lifeos.expense.dto.TransactionRequest;
import com.lifeos.expense.dto.TransactionResponse;
import com.lifeos.expense.service.ExpenseInsightsService;
import com.lifeos.expense.service.ExpenseService;
import com.lifeos.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@Tag(name = "Expenses", description = "Income/expense tracking and spending analytics")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final ExpenseInsightsService insightsService;

    public ExpenseController(ExpenseService expenseService, ExpenseInsightsService insightsService) {
        this.expenseService = expenseService;
        this.insightsService = insightsService;
    }

    @GetMapping
    @Operation(summary = "List transactions, filterable by type, category and date range")
    public List<TransactionResponse> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam(required = false) ExpenseType type,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return expenseService.list(principal.getUser(), type, category, from, to).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    @PostMapping
    @Operation(summary = "Record a transaction (income or expense)")
    public ResponseEntity<TransactionResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(TransactionResponse.from(expenseService.create(principal.getUser(), request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a transaction")
    public TransactionResponse update(@AuthenticationPrincipal AppUserDetails principal,
                                      @PathVariable UUID id,
                                      @Valid @RequestBody TransactionRequest request) {
        return TransactionResponse.from(expenseService.update(principal.getUser(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable UUID id) {
        expenseService.delete(principal.getUser(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    @Operation(summary = "Totals and expense-by-category breakdown for a date range (defaults to current month)")
    public SummaryResponse summary(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return expenseService.summary(principal.getUser(), from, to);
    }

    @GetMapping("/monthly")
    @Operation(summary = "Income/expense/net series for the last N months (default 6)")
    public List<MonthlyPoint> monthly(@AuthenticationPrincipal AppUserDetails principal,
                                      @RequestParam(defaultValue = "6") int months) {
        return expenseService.monthly(principal.getUser(), months);
    }

    @PostMapping("/insights")
    @Operation(summary = "AI analysis of where you spend most and how to save (requires AI key)")
    public InsightsResponse insights(@AuthenticationPrincipal AppUserDetails principal) {
        return insightsService.analyze(principal.getUser());
    }
}
