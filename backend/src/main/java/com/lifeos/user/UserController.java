package com.lifeos.user;

import com.lifeos.security.AppUserDetails;
import com.lifeos.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Profile of the authenticated user")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(UserResponse.from(principal.getUser()));
    }
}
