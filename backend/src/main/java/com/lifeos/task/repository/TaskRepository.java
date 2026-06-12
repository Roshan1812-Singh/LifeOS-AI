package com.lifeos.task.repository;

import com.lifeos.task.domain.Task;
import com.lifeos.task.domain.TaskStatus;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, Long> {

    Optional<Task> findByPublicIdAndUser(UUID publicId, User user);

    List<Task> findByParentOrderByPositionAscCreatedAtAsc(Task parent);

    /**
     * Top-level tasks for a user with optional status and free-text (title/description)
     * filters. Subtasks (those with a parent) are excluded.
     */
    @Query("""
            SELECT t FROM Task t
            WHERE t.user = :user
              AND t.parent IS NULL
              AND (:status IS NULL OR t.status = :status)
              AND (:search IS NULL
                   OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY t.position ASC, t.createdAt DESC
            """)
    List<Task> search(@Param("user") User user,
                      @Param("status") TaskStatus status,
                      @Param("search") String search);
}
