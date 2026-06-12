package com.lifeos.ai.dto;

import com.lifeos.ai.domain.Conversation;

import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(UUID id, String title, Instant createdAt, Instant updatedAt) {

    public static ConversationResponse from(Conversation c) {
        return new ConversationResponse(c.getPublicId(), c.getTitle(), c.getCreatedAt(),
                c.getUpdatedAt());
    }
}
