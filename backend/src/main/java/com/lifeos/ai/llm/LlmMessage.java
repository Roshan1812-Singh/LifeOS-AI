package com.lifeos.ai.llm;

/**
 * A single message in an LLM chat completion request, independent of any vendor.
 */
public record LlmMessage(Role role, String content) {

    public enum Role {
        SYSTEM,
        USER,
        ASSISTANT
    }

    public static LlmMessage system(String content) {
        return new LlmMessage(Role.SYSTEM, content);
    }

    public static LlmMessage user(String content) {
        return new LlmMessage(Role.USER, content);
    }

    public static LlmMessage assistant(String content) {
        return new LlmMessage(Role.ASSISTANT, content);
    }
}
