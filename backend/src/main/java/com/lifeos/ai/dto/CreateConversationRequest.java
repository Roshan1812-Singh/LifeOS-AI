package com.lifeos.ai.dto;

import jakarta.validation.constraints.Size;

public record CreateConversationRequest(
        @Size(max = 200) String title
) {
}
