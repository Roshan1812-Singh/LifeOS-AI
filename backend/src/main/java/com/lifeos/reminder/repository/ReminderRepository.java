package com.lifeos.reminder.repository;

import com.lifeos.reminder.domain.Reminder;
import com.lifeos.reminder.domain.ReminderStatus;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByUserOrderByRemindAtAsc(User user);

    List<Reminder> findByUserAndStatusOrderByRemindAtAsc(User user, ReminderStatus status);

    Optional<Reminder> findByPublicIdAndUser(UUID publicId, User user);

    /**
     * Due reminders ready to be fired (used by the scheduler in later phases).
     */
    List<Reminder> findByStatusAndRemindAtLessThanEqual(ReminderStatus status, Instant cutoff);
}
