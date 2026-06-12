package com.lifeos.ai.dto;

/**
 * Returned after a chat turn: the persisted user message, the assistant reply,
 * and the (possibly updated) conversation metadata.
 */
public record ChatTurnResponse(
        ConversationResponse conversation,
        ChatMessageResponse userMessage,
        ChatMessageResponse assistantMessage
) {
}
