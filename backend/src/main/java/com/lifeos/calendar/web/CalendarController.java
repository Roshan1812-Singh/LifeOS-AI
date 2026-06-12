package com.lifeos.calendar.web;

import com.lifeos.calendar.dto.CalendarEventRequest;
import com.lifeos.calendar.dto.CalendarEventResponse;
import com.lifeos.calendar.service.CalendarService;
import com.lifeos.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar/events")
@Tag(name = "Calendar", description = "Calendar events and scheduling")
@SecurityRequirement(name = "bearerAuth")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    @Operation(summary = "List events, optionally within a [from, to] window")
    public List<CalendarEventResponse> list(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return calendarService.list(principal.getUser(), from, to).stream()
                .map(CalendarEventResponse::from)
                .toList();
    }

    @PostMapping
    @Operation(summary = "Create a calendar event")
    public ResponseEntity<CalendarEventResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @Valid @RequestBody CalendarEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CalendarEventResponse.from(calendarService.create(principal.getUser(), request)));
    }

    @PutMapping("/{eventId}")
    @Operation(summary = "Update a calendar event")
    public CalendarEventResponse update(@AuthenticationPrincipal AppUserDetails principal,
                                        @PathVariable UUID eventId,
                                        @Valid @RequestBody CalendarEventRequest request) {
        return CalendarEventResponse.from(
                calendarService.update(principal.getUser(), eventId, request));
    }

    @DeleteMapping("/{eventId}")
    @Operation(summary = "Delete a calendar event")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable UUID eventId) {
        calendarService.delete(principal.getUser(), eventId);
        return ResponseEntity.noContent().build();
    }
}
