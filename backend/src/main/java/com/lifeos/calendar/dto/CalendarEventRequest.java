package com.lifeos.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CalendarEventRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 10000) String description,
        @Size(max = 255) String location,
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        Boolean allDay
) {
}
