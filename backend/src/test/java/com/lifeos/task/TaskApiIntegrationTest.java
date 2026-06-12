package com.lifeos.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void registerUser() throws Exception {
        String email = "tasks-" + System.nanoTime() + "@example.com";
        String body = """
                {"name":"Task Tester","email":"%s","password":"Str0ngPass"}
                """.formatted(email);
        String json = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        token = objectMapper.readTree(json).get("accessToken").asText();
    }

    @Test
    void createListAndCompleteTask() throws Exception {
        String created = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Finish Java project","priority":"HIGH","category":"Work"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andReturn().getResponse().getContentAsString();

        String taskId = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Finish Java project"));

        mockMvc.perform(patch("/api/tasks/" + taskId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());
    }

    @Test
    void createSubtaskUnderParent() throws Exception {
        String parent = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Parent task\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String parentId = objectMapper.readTree(parent).get("id").asText();

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Child task\",\"parentId\":\"" + parentId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.parentId").value(parentId));

        // Subtask should be nested under the parent in the listing, not top-level
        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].subtasks[0].title").value("Child task"));
    }

    @Test
    void protectedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void calendarRejectsEndBeforeStart() throws Exception {
        mockMvc.perform(post("/api/calendar/events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Bad event","startTime":"2026-02-01T10:00:00Z","endTime":"2026-02-01T09:00:00Z"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createReminderWithRecurrence() throws Exception {
        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Standup","remindAt":"2026-02-02T09:00:00Z","recurrence":"WEEKLY","channel":"PUSH"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recurrence").value("WEEKLY"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
