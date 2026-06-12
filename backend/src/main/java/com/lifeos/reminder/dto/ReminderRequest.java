package com.lifeos.reminder.dto;

import com.lifeos.reminder.domain.NotificationChannel;
import com.lifeos.reminder.domain.Recurrence;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record ReminderRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 5000) String notes,
        @NotNull Instant remindAt,
        Recurrence recurrence,
        NotificationChannel channel,
        @Size(max = 255) String locationLabel,
        Double locationLat,
        Double locationLng
) {
}
