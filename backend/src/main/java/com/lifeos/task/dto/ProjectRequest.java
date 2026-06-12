package com.lifeos.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank @Size(max = 150) String name,
        @Pattern(regexp = "^$|^#[0-9A-Fa-f]{6}$", message = "Color must be a hex code like #4f46e5")
        String color
) {
}
