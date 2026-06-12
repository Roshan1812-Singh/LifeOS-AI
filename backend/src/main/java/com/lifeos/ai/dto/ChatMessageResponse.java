package com.lifeos.ai.dto;

import com.lifeos.ai.domain.ChatMessage;
import com.lifeos.ai.domain.MessageRole;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(UUID id, MessageRole role, String content, Instant createdAt) {

    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(m.getPublicId(), m.getRole(), m.getContent(),
                m.getCreatedAt());
    }
}
