package com.lifeos.task.web;

import com.lifeos.security.AppUserDetails;
import com.lifeos.task.domain.TaskStatus;
import com.lifeos.task.dto.CreateTaskRequest;
import com.lifeos.task.dto.ReorderRequest;
import com.lifeos.task.dto.TaskResponse;
import com.lifeos.task.dto.UpdateStatusRequest;
import com.lifeos.task.dto.UpdateTaskRequest;
import com.lifeos.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks", description = "Tasks, subtasks and projects")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    @Operation(summary = "List top-level tasks (with subtasks), filterable by status and search")
    public List<TaskResponse> list(@AuthenticationPrincipal AppUserDetails principal,
                                   @RequestParam(required = false) TaskStatus status,
                                   @RequestParam(required = false) String search) {
        return taskService.list(principal.getUser(), status, search);
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get a task by id")
    public TaskResponse get(@AuthenticationPrincipal AppUserDetails principal,
                            @PathVariable UUID taskId) {
        return taskService.get(principal.getUser(), taskId);
    }

    @PostMapping
    @Operation(summary = "Create a task or subtask")
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                               @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(principal.getUser(), request));
    }

    @PutMapping("/{taskId}")
    @Operation(summary = "Update a task")
    public TaskResponse update(@AuthenticationPrincipal AppUserDetails principal,
                               @PathVariable UUID taskId,
                               @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.update(principal.getUser(), taskId, request);
    }

    @PatchMapping("/{taskId}/status")
    @Operation(summary = "Update a task's status")
    public TaskResponse updateStatus(@AuthenticationPrincipal AppUserDetails principal,
                                     @PathVariable UUID taskId,
                                     @Valid @RequestBody UpdateStatusRequest request) {
        return taskService.updateStatus(principal.getUser(), taskId, request.status());
    }

    @PostMapping("/reorder")
    @Operation(summary = "Persist drag-and-drop ordering of top-level tasks")
    public ResponseEntity<Void> reorder(@AuthenticationPrincipal AppUserDetails principal,
                                        @Valid @RequestBody ReorderRequest request) {
        taskService.reorder(principal.getUser(), request.orderedTaskIds());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "Delete a task")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable UUID taskId) {
        taskService.delete(principal.getUser(), taskId);
        return ResponseEntity.noContent().build();
    }
}
