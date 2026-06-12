package com.lifeos.task.service;

import com.lifeos.common.exception.BadRequestException;
import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.task.domain.Priority;
import com.lifeos.task.domain.Project;
import com.lifeos.task.domain.Task;
import com.lifeos.task.domain.TaskStatus;
import com.lifeos.task.dto.CreateTaskRequest;
import com.lifeos.task.dto.TaskResponse;
import com.lifeos.task.dto.UpdateTaskRequest;
import com.lifeos.task.repository.TaskRepository;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final UserService userService;

    public TaskService(TaskRepository taskRepository, ProjectService projectService,
                       UserService userService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(User user, TaskStatus status, String search) {
        User managed = userService.reference(user);
        String term = (search != null && !search.isBlank()) ? search.trim() : null;
        return taskRepository.search(managed, status, term).stream()
                .map(this::toResponseWithSubtasks)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse get(User user, UUID taskId) {
        return toResponseWithSubtasks(require(user, taskId));
    }

    @Transactional
    public TaskResponse create(User user, CreateTaskRequest request) {
        User managed = userService.reference(user);
        Task task = new Task(managed, request.title().trim());
        task.setDescription(request.description());
        task.setPriority(request.priority() != null ? request.priority() : Priority.MEDIUM);
        task.setCategory(request.category());
        task.setDueDate(request.dueDate());

        if (request.projectId() != null) {
            task.setProject(projectService.require(user, request.projectId()));
        }
        if (request.parentId() != null) {
            Task parent = require(user, request.parentId());
            if (parent.getParent() != null) {
                throw new BadRequestException("Subtasks cannot be nested more than one level");
            }
            task.setParent(parent);
            task.setPosition(taskRepository.findByParentOrderByPositionAscCreatedAtAsc(parent).size());
        } else {
            task.setPosition(taskRepository.search(managed, null, null).size());
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(User user, UUID taskId, UpdateTaskRequest request) {
        Task task = require(user, taskId);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setCategory(request.category());
        task.setDueDate(request.dueDate());
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.status() != null && request.status() != task.getStatus()) {
            task.changeStatus(request.status());
        }
        if (request.projectId() != null) {
            task.setProject(projectService.require(user, request.projectId()));
        } else {
            task.setProject(null);
        }
        return toResponseWithSubtasks(task);
    }

    @Transactional
    public TaskResponse updateStatus(User user, UUID taskId, TaskStatus status) {
        Task task = require(user, taskId);
        task.changeStatus(status);
        return toResponseWithSubtasks(task);
    }

    @Transactional
    public void delete(User user, UUID taskId) {
        taskRepository.delete(require(user, taskId));
    }

    @Transactional
    public void reorder(User user, List<UUID> orderedTaskIds) {
        User managed = userService.reference(user);
        int position = 0;
        for (UUID id : orderedTaskIds) {
            Task task = taskRepository.findByPublicIdAndUser(id, managed)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
            task.setPosition(position++);
        }
    }

    @Transactional(readOnly = true)
    public Task require(User user, UUID taskId) {
        return taskRepository.findByPublicIdAndUser(taskId, userService.reference(user))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private TaskResponse toResponseWithSubtasks(Task task) {
        List<TaskResponse> subtasks = taskRepository
                .findByParentOrderByPositionAscCreatedAtAsc(task).stream()
                .map(TaskResponse::from)
                .toList();
        return TaskResponse.from(task, subtasks);
    }
}
