package com.lifeos.reminder.dto;

import com.lifeos.reminder.domain.NotificationChannel;
import com.lifeos.reminder.domain.Recurrence;
import com.lifeos.reminder.domain.Reminder;
import com.lifeos.reminder.domain.ReminderStatus;

import java.time.Instant;
import java.util.UUID;

public record ReminderResponse(
        UUID id,
        String title,
        String notes,
        Instant remindAt,
        Recurrence recurrence,
        NotificationChannel channel,
        ReminderStatus status,
        String locationLabel,
        Double locationLat,
        Double locationLng,
        Instant lastFiredAt,
        Instant createdAt
) {
    public static ReminderResponse from(Reminder r) {
        return new ReminderResponse(
                r.getPublicId(), r.getTitle(), r.getNotes(), r.getRemindAt(),
                r.getRecurrence(), r.getChannel(), r.getStatus(),
                r.getLocationLabel(), r.getLocationLat(), r.getLocationLng(),
                r.getLastFiredAt(), r.getCreatedAt());
    }
}
