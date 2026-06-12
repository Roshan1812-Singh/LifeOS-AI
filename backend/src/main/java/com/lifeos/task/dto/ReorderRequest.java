package com.lifeos.task.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Drag-and-drop ordering: the full ordered list of top-level task ids.
 */
public record ReorderRequest(
        @NotNull List<UUID> orderedTaskIds
) {
}
