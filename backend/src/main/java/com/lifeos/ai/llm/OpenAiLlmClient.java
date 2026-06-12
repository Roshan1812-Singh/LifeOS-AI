package com.lifeos.ai.llm;

import com.lifeos.ai.config.AiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * {@link LlmClient} backed by the OpenAI (or any OpenAI-compatible) Chat
 * Completions API. The provider call is real; if no API key is configured the
 * client reports itself unavailable so the service layer can fail honestly
 * rather than fabricate a response.
 */
@Component
public class OpenAiLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiLlmClient.class);

    private final AiProperties properties;
    private final RestClient restClient;

    public OpenAiLlmClient(AiProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.baseUrl(properties.baseUrl()).build();
    }

    @Override
    public boolean isAvailable() {
        return properties.isConfigured();
    }

    @Override
    public LlmCompletion complete(List<LlmMessage> messages) {
        if (!isAvailable()) {
            throw new LlmException("LLM provider is not configured");
        }

        List<Map<String, String>> payloadMessages = messages.stream()
                .map(m -> Map.of(
                        "role", m.role().name().toLowerCase(Locale.ROOT),
                        "content", m.content()))
                .toList();

        Map<String, Object> body = Map.of(
                "model", properties.model(),
                "temperature", properties.temperature(),
                "messages", payloadMessages);

        try {
            OpenAiResponse response = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(OpenAiResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new LlmException("LLM returned an empty response");
            }
            String content = response.choices().get(0).message().content();
            Integer promptTokens = response.usage() != null ? response.usage().promptTokens() : null;
            Integer completionTokens = response.usage() != null
                    ? response.usage().completionTokens() : null;
            return new LlmCompletion(content.trim(), promptTokens, completionTokens);
        } catch (LlmException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenAI chat completion failed", e);
            throw new LlmException("Failed to reach the AI provider", e);
        }
    }

    // --- Minimal response mapping (only the fields we consume) ---

    private record OpenAiResponse(List<Choice> choices, Usage usage) {
    }

    private record Choice(Message message) {
    }

    private record Message(String role, String content) {
    }

    private record Usage(
            @com.fasterxml.jackson.annotation.JsonProperty("prompt_tokens") Integer promptTokens,
            @com.fasterxml.jackson.annotation.JsonProperty("completion_tokens") Integer completionTokens) {
    }
}
