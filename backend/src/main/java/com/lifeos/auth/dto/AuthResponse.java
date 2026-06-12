package com.lifeos.auth.dto;

import com.lifeos.user.dto.UserResponse;

/**
 * Returned on successful registration, login and token refresh.
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInMs,
        UserResponse user
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresInMs,
                                  UserResponse user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresInMs, user);
    }
}
