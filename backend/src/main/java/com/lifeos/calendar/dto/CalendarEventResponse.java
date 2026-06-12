package com.lifeos.calendar.dto;

import com.lifeos.calendar.domain.CalendarEvent;

import java.time.Instant;
import java.util.UUID;

public record CalendarEventResponse(
        UUID id,
        String title,
        String description,
        String location,
        Instant startTime,
        Instant endTime,
        boolean allDay
) {
    public static CalendarEventResponse from(CalendarEvent e) {
        return new CalendarEventResponse(e.getPublicId(), e.getTitle(), e.getDescription(),
                e.getLocation(), e.getStartTime(), e.getEndTime(), e.isAllDay());
    }
}
