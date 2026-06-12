package com.lifeos.ai.web;

import com.lifeos.ai.dto.PreferenceRequest;
import com.lifeos.ai.dto.PreferenceResponse;
import com.lifeos.ai.service.PreferenceService;
import com.lifeos.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai/preferences")
@Tag(name = "AI Memory", description = "Long-term memory: durable user preferences")
@SecurityRequirement(name = "bearerAuth")
public class PreferenceController {

    private final PreferenceService preferenceService;

    public PreferenceController(PreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    @Operation(summary = "List the user's stored preferences")
    public List<PreferenceResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return preferenceService.list(principal.getUser()).stream()
                .map(PreferenceResponse::from)
                .toList();
    }

    @PutMapping
    @Operation(summary = "Create or update a preference")
    public PreferenceResponse upsert(@AuthenticationPrincipal AppUserDetails principal,
                                     @Valid @RequestBody PreferenceRequest request) {
        return PreferenceResponse.from(
                preferenceService.upsert(principal.getUser(), request.key(), request.value()));
    }

    @DeleteMapping("/{key}")
    @Operation(summary = "Delete a preference")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable String key) {
        preferenceService.delete(principal.getUser(), key);
        return ResponseEntity.noContent().build();
    }
}
