package com.lifeos.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PreferenceRequest(
        @NotBlank @Size(max = 120) String key,
        @NotBlank @Size(max = 2000) String value
) {
}
