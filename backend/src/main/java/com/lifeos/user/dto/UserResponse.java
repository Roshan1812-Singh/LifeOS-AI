package com.lifeos.user.dto;

import com.lifeos.user.Role;
import com.lifeos.user.User;

import java.util.UUID;

/**
 * Public representation of a user. Never exposes the password hash or internal id.
 */
public record UserResponse(
        UUID id,
        String name,
        String email,
        String phone,
        Role role,
        boolean emailVerified
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getPublicId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified()
        );
    }
}
