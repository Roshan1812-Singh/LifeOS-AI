package com.lifeos.document.dto;

import com.lifeos.document.domain.Document;

public record DocumentDetailResponse(
        DocumentResponse document,
        String textPreview
) {
    private static final int PREVIEW_CHARS = 4000;

    public static DocumentDetailResponse from(Document d) {
        String text = d.getExtractedText();
        String preview = text == null ? null
                : (text.length() > PREVIEW_CHARS ? text.substring(0, PREVIEW_CHARS) + "..." : text);
        return new DocumentDetailResponse(DocumentResponse.from(d), preview);
    }
}
