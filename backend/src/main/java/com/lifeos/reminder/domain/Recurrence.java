package com.lifeos.reminder.domain;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

/**
 * How a reminder repeats. {@link #nextOccurrence(Instant)} computes the next
 * fire time after the given instant (UTC), or null for one-off reminders.
 */
public enum Recurrence {
    NONE,
    DAILY,
    WEEKLY,
    MONTHLY,
    YEARLY;

    public Instant nextOccurrence(Instant from) {
        return switch (this) {
            case NONE -> null;
            case DAILY -> from.plus(1, ChronoUnit.DAYS);
            case WEEKLY -> from.plus(7, ChronoUnit.DAYS);
            case MONTHLY -> from.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
            case YEARLY -> from.atZone(ZoneOffset.UTC).plusYears(1).toInstant();
        };
    }
}
