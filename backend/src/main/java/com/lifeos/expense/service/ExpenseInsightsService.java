package com.lifeos.expense.service;

import com.lifeos.ai.llm.LlmClient;
import com.lifeos.ai.llm.LlmCompletion;
import com.lifeos.ai.llm.LlmException;
import com.lifeos.ai.llm.LlmMessage;
import com.lifeos.common.exception.ApiException;
import com.lifeos.expense.dto.CategoryBreakdown;
import com.lifeos.expense.dto.InsightsResponse;
import com.lifeos.expense.dto.MonthlyPoint;
import com.lifeos.expense.dto.SummaryResponse;
import com.lifeos.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Produces a natural-language analysis of a user's spending ("where am I spending
 * most money?", savings tips, trends). It first computes deterministic analytics
 * (which work without any external service) and then asks the configured LLM to
 * turn those numbers into advice. If no LLM is configured it fails honestly with
 * a 503 rather than inventing an answer.
 */
@Service
public class ExpenseInsightsService {

    private final ExpenseService expenseService;
    private final LlmClient llmClient;

    public ExpenseInsightsService(ExpenseService expenseService, LlmClient llmClient) {
        this.expenseService = expenseService;
        this.llmClient = llmClient;
    }

    public InsightsResponse analyze(User user) {
        LocalDate to = LocalDate.now(ZoneOffset.UTC);
        LocalDate from = to.minus(90, ChronoUnit.DAYS);
        SummaryResponse summary = expenseService.summary(user, from, to);
        List<MonthlyPoint> monthly = expenseService.monthly(user, 3);

        if (summary.transactionCount() == 0) {
            return new InsightsResponse(
                    "You haven't logged any income or expenses yet. Add a few transactions and I'll "
                            + "analyze where your money is going.");
        }

        if (!llmClient.isAvailable()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI is not configured. Set the AI provider API key (e.g. OPENAI_API_KEY) to get "
                            + "spending insights.");
        }

        String prompt = buildPrompt(summary, monthly);
        List<LlmMessage> messages = new ArrayList<>();
        messages.add(LlmMessage.system("""
                You are LifeOS AI's personal finance coach. Using ONLY the figures provided, give a \
                short, practical analysis of the user's spending. Cover: where most money goes, any \
                notable trend across months, and 2-3 concrete, friendly savings suggestions. Use the \
                given currency. Do not invent numbers. Keep it under 180 words."""));
        messages.add(LlmMessage.user(prompt));

        try {
            LlmCompletion completion = llmClient.complete(messages);
            return new InsightsResponse(completion.content());
        } catch (LlmException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI provider could not be reached. Please try again.");
        }
    }

    private String buildPrompt(SummaryResponse summary, List<MonthlyPoint> monthly) {
        StringBuilder sb = new StringBuilder();
        sb.append("Currency: ").append(summary.currency()).append('\n');
        sb.append("Period: ").append(summary.from()).append(" to ").append(summary.to()).append('\n');
        sb.append("Total income: ").append(summary.totalIncome()).append('\n');
        sb.append("Total expense: ").append(summary.totalExpense()).append('\n');
        sb.append("Net: ").append(summary.net()).append('\n');
        sb.append("Expense by category:\n");
        for (CategoryBreakdown c : summary.expenseByCategory()) {
            sb.append("  - ").append(c.category()).append(": ").append(c.total())
                    .append(" (").append(c.percentage()).append("%)\n");
        }
        sb.append("Monthly trend (income / expense / net):\n");
        for (MonthlyPoint p : monthly) {
            sb.append("  - ").append(p.month()).append(": ").append(p.income()).append(" / ")
                    .append(p.expense()).append(" / ").append(p.net()).append('\n');
        }
        return sb.toString();
    }
}
