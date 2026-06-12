package com.lifeos.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Strongly-typed security configuration bound from {@code lifeos.security.*}.
 * Backed by environment variables so secrets never live in source control.
 */
@Validated
@ConfigurationProperties(prefix = "lifeos.security")
public record SecurityProperties(Jwt jwt, Cors cors) {

    public record Jwt(
            @NotBlank String secret,
            @Positive long accessTokenExpirationMs,
            @Positive long refreshTokenExpirationMs
    ) {
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
