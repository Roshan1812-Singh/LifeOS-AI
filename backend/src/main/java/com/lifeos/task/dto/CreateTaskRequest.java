package com.lifeos.task.dto;

import com.lifeos.task.domain.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 10000) String description,
        Priority priority,
        @Size(max = 80) String category,
        Instant dueDate,
        UUID projectId,
        UUID parentId
) {
}
