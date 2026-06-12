package com.lifeos.ai.domain;

import com.lifeos.common.domain.BaseEntity;
import com.lifeos.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Long-term memory: a durable key/value fact or preference the assistant should
 * remember about the user (e.g. "reminder_time" -> "after 7 PM").
 */
@Entity
@Table(name = "user_preferences",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "pref_key"}))
public class UserPreference extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "pref_key", nullable = false, length = 120)
    private String key;

    @Column(name = "pref_value", nullable = false, columnDefinition = "text")
    private String value;

    protected UserPreference() {
        // for JPA
    }

    public UserPreference(User user, String key, String value) {
        this.user = user;
        this.key = key;
        this.value = value;
    }

    public User getUser() {
        return user;
    }

    public String getKey() {
        return key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
