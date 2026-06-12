package com.lifeos.expense;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExpenseApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void registerUser() throws Exception {
        String email = "expense-" + System.nanoTime() + "@example.com";
        String body = """
                {"name":"Expense Tester","email":"%s","password":"Str0ngPass"}
                """.formatted(email);
        String json = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        token = objectMapper.readTree(json).get("accessToken").asText();
    }

    private void record(String type, String amount, String category, String date) throws Exception {
        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"%s","amount":%s,"category":"%s","occurredOn":"%s","currency":"USD"}
                                """.formatted(type, amount, category, date)))
                .andExpect(status().isCreated());
    }

    @Test
    void summaryComputesTotalsAndTopCategory() throws Exception {
        String today = LocalDate.now().withDayOfMonth(10).toString();
        record("INCOME", "5000.00", "SALARY", today);
        record("EXPENSE", "300.00", "FOOD", today);
        record("EXPENSE", "1200.00", "RENT", today);
        record("EXPENSE", "150.00", "FOOD", today);

        mockMvc.perform(get("/api/expenses/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(5000.00))
                .andExpect(jsonPath("$.totalExpense").value(1650.00))
                .andExpect(jsonPath("$.net").value(3350.00))
                .andExpect(jsonPath("$.topExpenseCategory").value("RENT"))
                .andExpect(jsonPath("$.expenseByCategory[0].category").value("RENT"));
    }

    @Test
    void listFiltersByType() throws Exception {
        String today = LocalDate.now().withDayOfMonth(5).toString();
        record("INCOME", "2000.00", "SALARY", today);
        record("EXPENSE", "80.00", "TRAVEL", today);

        mockMvc.perform(get("/api/expenses?type=EXPENSE")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("TRAVEL"));
    }

    @Test
    void monthlySeriesReturnsRequestedWindow() throws Exception {
        mockMvc.perform(get("/api/expenses/monthly?months=4")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));
    }

    @Test
    void rejectsNonPositiveAmount() throws Exception {
        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"EXPENSE","amount":0,"category":"FOOD","occurredOn":"2026-01-01"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void insightsWithoutAiKeyReturns503() throws Exception {
        String today = LocalDate.now().withDayOfMonth(3).toString();
        record("EXPENSE", "42.00", "FOOD", today);

        mockMvc.perform(post("/api/expenses/insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void protectedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/expenses/summary")).andExpect(status().isUnauthorized());
    }
}
