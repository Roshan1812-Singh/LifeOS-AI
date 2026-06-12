package com.lifeos.ai.llm;

/**
 * Raised when an LLM provider call fails (network, auth, rate-limit, etc.).
 */
public class LlmException extends RuntimeException {

    public LlmException(String message) {
        super(message);
    }

    public LlmException(String message, Throwable cause) {
        super(message, cause);
    }
}
