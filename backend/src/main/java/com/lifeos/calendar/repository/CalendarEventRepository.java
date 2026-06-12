package com.lifeos.calendar.repository;

import com.lifeos.calendar.domain.CalendarEvent;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    Optional<CalendarEvent> findByPublicIdAndUser(UUID publicId, User user);

    List<CalendarEvent> findByUserOrderByStartTimeAsc(User user);

    /**
     * Events overlapping the [from, to] window, ordered by start time.
     */
    @Query("""
            SELECT e FROM CalendarEvent e
            WHERE e.user = :user
              AND e.startTime <= :to
              AND e.endTime >= :from
            ORDER BY e.startTime ASC
            """)
    List<CalendarEvent> findInRange(@Param("user") User user,
                                    @Param("from") Instant from,
                                    @Param("to") Instant to);
}
