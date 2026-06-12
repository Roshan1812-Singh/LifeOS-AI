package com.lifeos.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String name,

        @NotBlank @Email @Size(max = 255) String email,

        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "Password must contain upper case, lower case and a digit")
        String password,

        @Pattern(regexp = "^$|^\\+?[0-9 ()-]{7,20}$", message = "Invalid phone number")
        String phone
) {
}
