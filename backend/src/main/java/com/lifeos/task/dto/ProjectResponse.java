package com.lifeos.task.dto;

import com.lifeos.task.domain.Project;

import java.util.UUID;

public record ProjectResponse(UUID id, String name, String color) {

    public static ProjectResponse from(Project p) {
        return new ProjectResponse(p.getPublicId(), p.getName(), p.getColor());
    }
}
