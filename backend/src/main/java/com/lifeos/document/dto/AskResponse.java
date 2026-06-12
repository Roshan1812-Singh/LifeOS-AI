package com.lifeos.document.dto;

import com.lifeos.document.domain.Document;
import com.lifeos.document.domain.DocumentCategory;

import java.util.List;
import java.util.UUID;

public record AskResponse(String answer, List<Source> sources) {

    public record Source(UUID id, String title, DocumentCategory category) {
        public static Source from(Document d) {
            return new Source(d.getPublicId(), d.getTitle(), d.getCategory());
        }
    }
}
