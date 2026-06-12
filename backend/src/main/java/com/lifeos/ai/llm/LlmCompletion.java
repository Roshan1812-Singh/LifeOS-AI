package com.lifeos.ai.llm;

/**
 * The result of an LLM chat completion.
 */
public record LlmCompletion(String content, Integer promptTokens, Integer completionTokens) {
}
