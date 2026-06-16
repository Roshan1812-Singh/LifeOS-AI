package com.lifeos.task.repository;

import com.lifeos.task.domain.Task;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    Optional<Task> findByPublicIdAndUser(UUID publicId, User user);

    List<Task> findByParentOrderByPositionAscCreatedAtAsc(Task parent);

    /**
     * Top-level tasks for a user, ordered for display. Used for the unfiltered
     * listing and to compute the next position on creation.
     *
     * <p>Filtered listing (by status/search) is done with a {@link JpaSpecificationExecutor}
     * Specification in the service. We deliberately avoid the
     * {@code :param IS NULL OR column = :param} pattern here: PostgreSQL cannot
     * infer the data type of a bound NULL enum parameter and fails the whole query
     * (it works on H2, which is why this slipped through locally).
     */
    @Query("""
            SELECT t FROM Task t
            WHERE t.user = :user
              AND t.parent IS NULL
            ORDER BY t.position ASC, t.createdAt DESC
            """)
    List<Task> findTopLevel(@Param("user") User user);
}
