package com.lifeos.reminder;

import com.lifeos.reminder.domain.Recurrence;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class RecurrenceTest {

    private final Instant base = Instant.parse("2026-01-15T08:00:00Z");

    @Test
    void noneHasNoNextOccurrence() {
        assertThat(Recurrence.NONE.nextOccurrence(base)).isNull();
    }

    @Test
    void dailyAddsOneDay() {
        assertThat(Recurrence.DAILY.nextOccurrence(base))
                .isEqualTo(base.plus(1, ChronoUnit.DAYS));
    }

    @Test
    void weeklyAddsSevenDays() {
        assertThat(Recurrence.WEEKLY.nextOccurrence(base))
                .isEqualTo(base.plus(7, ChronoUnit.DAYS));
    }

    @Test
    void monthlyAdvancesByOneCalendarMonth() {
        assertThat(Recurrence.MONTHLY.nextOccurrence(base))
                .isEqualTo(Instant.parse("2026-02-15T08:00:00Z"));
    }

    @Test
    void yearlyAdvancesByOneYear() {
        assertThat(Recurrence.YEARLY.nextOccurrence(base))
                .isEqualTo(Instant.parse("2027-01-15T08:00:00Z"));
    }
}
