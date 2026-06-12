package com.lifeos.ai.domain;

import com.lifeos.common.domain.BaseEntity;
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
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "token_count")
    private Integer tokenCount;

    protected ChatMessage() {
        // for JPA
    }

    public ChatMessage(Conversation conversation, MessageRole role, String content,
                       Integer tokenCount) {
        this.publicId = UUID.randomUUID();
        this.conversation = conversation;
        this.role = role;
        this.content = content;
        this.tokenCount = tokenCount;
    }

    public UUID getPublicId() {
        return publicId;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public MessageRole getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public Integer getTokenCount() {
        return tokenCount;
    }
}
