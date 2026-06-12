package com.lifeos.reminder.service;

import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.reminder.domain.NotificationChannel;
import com.lifeos.reminder.domain.Recurrence;
import com.lifeos.reminder.domain.Reminder;
import com.lifeos.reminder.domain.ReminderStatus;
import com.lifeos.reminder.dto.ReminderRequest;
import com.lifeos.reminder.repository.ReminderRepository;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserService userService;

    public ReminderService(ReminderRepository reminderRepository, UserService userService) {
        this.reminderRepository = reminderRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<Reminder> list(User user, ReminderStatus status) {
        User managed = userService.reference(user);
        return status != null
                ? reminderRepository.findByUserAndStatusOrderByRemindAtAsc(managed, status)
                : reminderRepository.findByUserOrderByRemindAtAsc(managed);
    }

    @Transactional
    public Reminder create(User user, ReminderRequest request) {
        Reminder reminder = new Reminder(userService.reference(user), request.title().trim(),
                request.remindAt());
        apply(reminder, request);
        return reminderRepository.save(reminder);
    }

    @Transactional
    public Reminder update(User user, UUID reminderId, ReminderRequest request) {
        Reminder reminder = require(user, reminderId);
        reminder.setTitle(request.title().trim());
        reminder.setRemindAt(request.remindAt());
        apply(reminder, request);
        return reminder;
    }

    @Transactional
    public Reminder updateStatus(User user, UUID reminderId, ReminderStatus status) {
        Reminder reminder = require(user, reminderId);
        reminder.setStatus(status);
        return reminder;
    }

    @Transactional
    public void delete(User user, UUID reminderId) {
        reminderRepository.delete(require(user, reminderId));
    }

    @Transactional(readOnly = true)
    public Reminder require(User user, UUID reminderId) {
        return reminderRepository.findByPublicIdAndUser(reminderId, userService.reference(user))
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));
    }

    private void apply(Reminder reminder, ReminderRequest request) {
        reminder.setNotes(request.notes());
        reminder.setRecurrence(request.recurrence() != null ? request.recurrence() : Recurrence.NONE);
        reminder.setChannel(request.channel() != null ? request.channel() : NotificationChannel.PUSH);
        reminder.setLocationLabel(request.locationLabel());
        reminder.setLocationLat(request.locationLat());
        reminder.setLocationLng(request.locationLng());
    }
}
