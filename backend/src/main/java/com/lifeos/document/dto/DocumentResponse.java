package com.lifeos.document.dto;

import com.lifeos.document.domain.Document;
import com.lifeos.document.domain.DocumentCategory;
import com.lifeos.document.domain.DocumentStatus;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String title,
        String originalName,
        String contentType,
        long sizeBytes,
        DocumentCategory category,
        DocumentStatus status,
        int textChars,
        String errorMessage,
        Instant createdAt
) {
    public static DocumentResponse from(Document d) {
        return new DocumentResponse(
                d.getPublicId(), d.getTitle(), d.getOriginalName(), d.getContentType(),
                d.getSizeBytes(), d.getCategory(), d.getStatus(), d.getTextChars(),
                d.getErrorMessage(), d.getCreatedAt());
    }
}
