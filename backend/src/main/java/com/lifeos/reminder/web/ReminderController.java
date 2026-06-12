package com.lifeos.reminder.web;

import com.lifeos.reminder.domain.ReminderStatus;
import com.lifeos.reminder.dto.ReminderRequest;
import com.lifeos.reminder.dto.ReminderResponse;
import com.lifeos.reminder.service.ReminderService;
import com.lifeos.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reminders")
@Tag(name = "Reminders", description = "Time, recurring and location reminders")
@SecurityRequirement(name = "bearerAuth")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping
    @Operation(summary = "List reminders, optionally filtered by status")
    public List<ReminderResponse> list(@AuthenticationPrincipal AppUserDetails principal,
                                       @RequestParam(required = false) ReminderStatus status) {
        return reminderService.list(principal.getUser(), status).stream()
                .map(ReminderResponse::from)
                .toList();
    }

    @PostMapping
    @Operation(summary = "Create a reminder")
    public ResponseEntity<ReminderResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                                   @Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ReminderResponse.from(reminderService.create(principal.getUser(), request)));
    }

    @PutMapping("/{reminderId}")
    @Operation(summary = "Update a reminder")
    public ReminderResponse update(@AuthenticationPrincipal AppUserDetails principal,
                                   @PathVariable UUID reminderId,
                                   @Valid @RequestBody ReminderRequest request) {
        return ReminderResponse.from(
                reminderService.update(principal.getUser(), reminderId, request));
    }

    @PatchMapping("/{reminderId}/status")
    @Operation(summary = "Update a reminder's status")
    public ReminderResponse updateStatus(@AuthenticationPrincipal AppUserDetails principal,
                                         @PathVariable UUID reminderId,
                                         @RequestParam ReminderStatus status) {
        return ReminderResponse.from(
                reminderService.updateStatus(principal.getUser(), reminderId, status));
    }

    @DeleteMapping("/{reminderId}")
    @Operation(summary = "Delete a reminder")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable UUID reminderId) {
        reminderService.delete(principal.getUser(), reminderId);
        return ResponseEntity.noContent().build();
    }
}
