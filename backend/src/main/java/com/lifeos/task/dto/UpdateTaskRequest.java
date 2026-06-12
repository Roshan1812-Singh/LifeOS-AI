package com.lifeos.task.dto;

import com.lifeos.task.domain.Priority;
import com.lifeos.task.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record UpdateTaskRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 10000) String description,
        Priority priority,
        TaskStatus status,
        @Size(max = 80) String category,
        Instant dueDate,
        UUID projectId
) {
}
