package com.lifeos.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void registerUser() throws Exception {
        String email = "docs-" + System.nanoTime() + "@example.com";
        String body = """
                {"name":"Doc Tester","email":"%s","password":"Str0ngPass"}
                """.formatted(email);
        String json = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        token = objectMapper.readTree(json).get("accessToken").asText();
    }

    @Test
    void uploadExtractsTextClassifiesAndIsSearchable() throws Exception {
        String content = "This insurance policy has a premium. The insured coverage expires on "
                + "2027-01-01. Policyholder: Demo User.";
        MockMultipartFile file = new MockMultipartFile("file", "insurance.txt", "text/plain",
                content.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/documents").file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("READY"))
                .andExpect(jsonPath("$.category").value("INSURANCE"))
                .andExpect(jsonPath("$.textChars").value(org.hamcrest.Matchers.greaterThan(0)));

        mockMvc.perform(get("/api/documents").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/documents/search").param("q", "insurance")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void askWithoutMatchingDocumentsReturnsHonestAnswer() throws Exception {
        mockMvc.perform(post("/api/documents/ask")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"zzqq nonexistent topic\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value(org.hamcrest.Matchers.containsString("couldn't find")))
                .andExpect(jsonPath("$.sources.length()").value(0));
    }

    @Test
    void askWithMatchingDocsButNoLlmReturnsServiceUnavailable() throws Exception {
        String content = "Electricity bill. Invoice amount due by the due date for billing period.";
        MockMultipartFile file = new MockMultipartFile("file", "eb.txt", "text/plain",
                content.getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/documents").file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Test profile has no AI key configured -> retrieval finds a doc but generation is unavailable.
        mockMvc.perform(post("/api/documents/ask")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What is my electricity bill amount?\"}"))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void uploadRequiresAuthentication() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "x.txt", "text/plain",
                "hello".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/documents").file(file))
                .andExpect(status().isUnauthorized());
    }
}
