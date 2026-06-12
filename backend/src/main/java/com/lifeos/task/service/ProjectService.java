package com.lifeos.task.service;

import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.task.domain.Project;
import com.lifeos.task.dto.ProjectRequest;
import com.lifeos.task.repository.ProjectRepository;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    public ProjectService(ProjectRepository projectRepository, UserService userService) {
        this.projectRepository = projectRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<Project> list(User user) {
        return projectRepository.findByUserOrderByCreatedAtAsc(userService.reference(user));
    }

    @Transactional
    public Project create(User user, ProjectRequest request) {
        Project project = new Project(userService.reference(user), request.name(), request.color());
        return projectRepository.save(project);
    }

    @Transactional
    public Project update(User user, UUID projectId, ProjectRequest request) {
        Project project = require(user, projectId);
        project.setName(request.name());
        project.setColor(request.color());
        return project;
    }

    @Transactional
    public void delete(User user, UUID projectId) {
        projectRepository.delete(require(user, projectId));
    }

    @Transactional(readOnly = true)
    public Project require(User user, UUID projectId) {
        return projectRepository.findByPublicIdAndUser(projectId, userService.reference(user))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }
}
