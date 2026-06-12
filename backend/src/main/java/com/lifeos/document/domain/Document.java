package com.lifeos.document.domain;

import com.lifeos.common.domain.BaseEntity;
import com.lifeos.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "documents")
public class Document extends BaseEntity {

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "storage_key", nullable = false, length = 512)
    private String storageKey;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DocumentCategory category = DocumentCategory.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private DocumentStatus status = DocumentStatus.PROCESSING;

    @Column(name = "extracted_text", columnDefinition = "text")
    private String extractedText;

    @Column(name = "text_chars", nullable = false)
    private int textChars;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    protected Document() {
        // for JPA
    }

    public Document(User user, String title, String originalName, String storageKey,
                    String contentType, long sizeBytes) {
        this.publicId = UUID.randomUUID();
        this.user = user;
        this.title = title;
        this.originalName = originalName;
        this.storageKey = storageKey;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
    }

    public void markReady(String extractedText, DocumentCategory category) {
        this.extractedText = extractedText;
        this.textChars = extractedText != null ? extractedText.length() : 0;
        this.category = category;
        this.status = DocumentStatus.READY;
        this.errorMessage = null;
    }

    public void markFailed(String message) {
        this.status = DocumentStatus.FAILED;
        this.errorMessage = message != null && message.length() > 500
                ? message.substring(0, 500) : message;
    }

    public UUID getPublicId() {
        return publicId;
    }

    public User getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public DocumentCategory getCategory() {
        return category;
    }

    public void setCategory(DocumentCategory category) {
        this.category = category;
    }

    public DocumentStatus getStatus() {
        return status;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public int getTextChars() {
        return textChars;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}
