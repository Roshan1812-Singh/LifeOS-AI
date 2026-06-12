package com.lifeos.ai.llm;

import java.util.List;

/**
 * Vendor-agnostic chat-completion abstraction. Implementations (OpenAI, Ollama,
 * Azure, …) are selected by configuration so the rest of the application never
 * depends on a specific provider.
 */
public interface LlmClient {

    /**
     * @return true when the client has the configuration it needs to make calls.
     */
    boolean isAvailable();

    /**
     * Sends the conversation to the model and returns its reply.
     *
     * @throws com.lifeos.ai.llm.LlmException if the provider call fails.
     */
    LlmCompletion complete(List<LlmMessage> messages);
}
