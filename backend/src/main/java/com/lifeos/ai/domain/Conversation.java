package com.lifeos.ai.domain;

import com.lifeos.common.domain.BaseEntity;
import com.lifeos.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "conversations")
public class Conversation extends BaseEntity {

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    protected Conversation() {
        // for JPA
    }

    public Conversation(User user, String title) {
        this.publicId = UUID.randomUUID();
        this.user = user;
        this.title = (title == null || title.isBlank()) ? "New conversation" : title.trim();
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
        if (title != null && !title.isBlank()) {
            this.title = title.trim();
        }
    }
}
