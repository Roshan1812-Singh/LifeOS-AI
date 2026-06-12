package com.lifeos.task.repository;

import com.lifeos.task.domain.Project;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUserOrderByCreatedAtAsc(User user);

    Optional<Project> findByPublicIdAndUser(UUID publicId, User user);
}
