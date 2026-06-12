package com.lifeos.task.dto;

import com.lifeos.task.domain.Priority;
import com.lifeos.task.domain.Task;
import com.lifeos.task.domain.TaskStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        Priority priority,
        TaskStatus status,
        String category,
        Instant dueDate,
        int position,
        UUID projectId,
        UUID parentId,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt,
        List<TaskResponse> subtasks
) {
    public static TaskResponse from(Task t, List<TaskResponse> subtasks) {
        return new TaskResponse(
                t.getPublicId(),
                t.getTitle(),
                t.getDescription(),
                t.getPriority(),
                t.getStatus(),
                t.getCategory(),
                t.getDueDate(),
                t.getPosition(),
                t.getProject() != null ? t.getProject().getPublicId() : null,
                t.getParent() != null ? t.getParent().getPublicId() : null,
                t.getCompletedAt(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                subtasks);
    }

    public static TaskResponse from(Task t) {
        return from(t, List.of());
    }
}
