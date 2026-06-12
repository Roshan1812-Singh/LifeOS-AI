package com.lifeos.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the AI layer, bound from {@code lifeos.ai.*}.
 * The API key comes from the environment so it is never committed.
 */
@ConfigurationProperties(prefix = "lifeos.ai")
public record AiProperties(
        String provider,
        String apiKey,
        String baseUrl,
        String model,
        String embeddingsModel,
        Double temperature,
        Integer maxHistoryMessages,
        String systemPrompt
) {
    public AiProperties {
        if (provider == null || provider.isBlank()) {
            provider = "openai";
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://api.openai.com/v1";
        }
        if (model == null || model.isBlank()) {
            model = "gpt-4o-mini";
        }
        if (embeddingsModel == null || embeddingsModel.isBlank()) {
            embeddingsModel = "text-embedding-3-small";
        }
        if (temperature == null) {
            temperature = 0.7;
        }
        if (maxHistoryMessages == null || maxHistoryMessages <= 0) {
            maxHistoryMessages = 20;
        }
        if (systemPrompt == null || systemPrompt.isBlank()) {
            systemPrompt = """
                    You are LifeOS AI, a helpful, concise personal assistant. \
                    You help the user manage tasks, reminders, calendar, notes, documents, \
                    expenses and learning. Respect the user's stored preferences. \
                    When you are unsure, ask a brief clarifying question.""";
        }
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
