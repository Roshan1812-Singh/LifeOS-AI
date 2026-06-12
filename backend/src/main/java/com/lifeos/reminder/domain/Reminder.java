package com.lifeos.reminder.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reminders")
public class Reminder extends BaseEntity {

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "remind_at", nullable = false)
    private Instant remindAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Recurrence recurrence = Recurrence.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NotificationChannel channel = NotificationChannel.PUSH;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ReminderStatus status = ReminderStatus.ACTIVE;

    @Column(name = "location_label")
    private String locationLabel;

    @Column(name = "location_lat")
    private Double locationLat;

    @Column(name = "location_lng")
    private Double locationLng;

    @Column(name = "last_fired_at")
    private Instant lastFiredAt;

    protected Reminder() {
        // for JPA
    }

    public Reminder(User user, String title, Instant remindAt) {
        this.publicId = UUID.randomUUID();
        this.user = user;
        this.title = title;
        this.remindAt = remindAt;
    }

    /**
     * Marks this reminder as fired now. Recurring reminders advance to their next
     * occurrence; one-off reminders are completed.
     */
    public void markFired() {
        this.lastFiredAt = Instant.now();
        Instant next = recurrence.nextOccurrence(this.remindAt);
        if (next != null) {
            this.remindAt = next;
        } else {
            this.status = ReminderStatus.COMPLETED;
        }
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getRemindAt() {
        return remindAt;
    }

    public void setRemindAt(Instant remindAt) {
        this.remindAt = remindAt;
    }

    public Recurrence getRecurrence() {
        return recurrence;
    }

    public void setRecurrence(Recurrence recurrence) {
        this.recurrence = recurrence;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public ReminderStatus getStatus() {
        return status;
    }

    public void setStatus(ReminderStatus status) {
        this.status = status;
    }

    public String getLocationLabel() {
        return locationLabel;
    }

    public void setLocationLabel(String locationLabel) {
        this.locationLabel = locationLabel;
    }

    public Double getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(Double locationLat) {
        this.locationLat = locationLat;
    }

    public Double getLocationLng() {
        return locationLng;
    }

    public void setLocationLng(Double locationLng) {
        this.locationLng = locationLng;
    }

    public Instant getLastFiredAt() {
        return lastFiredAt;
    }
}
