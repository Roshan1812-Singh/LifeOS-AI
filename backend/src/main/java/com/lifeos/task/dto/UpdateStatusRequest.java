package com.lifeos.task.dto;

import com.lifeos.task.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull TaskStatus status
) {
}
