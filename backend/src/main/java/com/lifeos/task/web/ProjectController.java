package com.lifeos.task.web;

import com.lifeos.security.AppUserDetails;
import com.lifeos.task.dto.ProjectRequest;
import com.lifeos.task.dto.ProjectResponse;
import com.lifeos.task.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Group tasks into projects")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    @Operation(summary = "List the user's projects")
    public List<ProjectResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return projectService.list(principal.getUser()).stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @PostMapping
    @Operation(summary = "Create a project")
    public ResponseEntity<ProjectResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                                  @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProjectResponse.from(projectService.create(principal.getUser(), request)));
    }

    @PutMapping("/{projectId}")
    @Operation(summary = "Update a project")
    public ProjectResponse update(@AuthenticationPrincipal AppUserDetails principal,
                                  @PathVariable UUID projectId,
                                  @Valid @RequestBody ProjectRequest request) {
        return ProjectResponse.from(projectService.update(principal.getUser(), projectId, request));
    }

    @DeleteMapping("/{projectId}")
    @Operation(summary = "Delete a project")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable UUID projectId) {
        projectService.delete(principal.getUser(), projectId);
        return ResponseEntity.noContent().build();
    }
}
