package com.lifeos.calendar.service;

import com.lifeos.calendar.domain.CalendarEvent;
import com.lifeos.calendar.dto.CalendarEventRequest;
import com.lifeos.calendar.repository.CalendarEventRepository;
import com.lifeos.common.exception.BadRequestException;
import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CalendarService {

    private final CalendarEventRepository eventRepository;
    private final UserService userService;

    public CalendarService(CalendarEventRepository eventRepository, UserService userService) {
        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<CalendarEvent> list(User user, Instant from, Instant to) {
        User managed = userService.reference(user);
        if (from != null && to != null) {
            return eventRepository.findInRange(managed, from, to);
        }
        return eventRepository.findByUserOrderByStartTimeAsc(managed);
    }

    @Transactional
    public CalendarEvent create(User user, CalendarEventRequest request) {
        validateRange(request.startTime(), request.endTime());
        CalendarEvent event = new CalendarEvent(userService.reference(user), request.title().trim(),
                request.startTime(), request.endTime());
        apply(event, request);
        return eventRepository.save(event);
    }

    @Transactional
    public CalendarEvent update(User user, UUID eventId, CalendarEventRequest request) {
        validateRange(request.startTime(), request.endTime());
        CalendarEvent event = require(user, eventId);
        event.setTitle(request.title().trim());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        apply(event, request);
        return event;
    }

    @Transactional
    public void delete(User user, UUID eventId) {
        eventRepository.delete(require(user, eventId));
    }

    @Transactional(readOnly = true)
    public CalendarEvent require(User user, UUID eventId) {
        return eventRepository.findByPublicIdAndUser(eventId, userService.reference(user))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    private void apply(CalendarEvent event, CalendarEventRequest request) {
        event.setDescription(request.description());
        event.setLocation(request.location());
        event.setAllDay(Boolean.TRUE.equals(request.allDay()));
    }

    private void validateRange(Instant start, Instant end) {
        if (end.isBefore(start)) {
            throw new BadRequestException("Event end time must not be before its start time");
        }
    }
}
