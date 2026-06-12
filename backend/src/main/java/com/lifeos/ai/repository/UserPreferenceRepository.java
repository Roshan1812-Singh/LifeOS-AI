package com.lifeos.ai.repository;

import com.lifeos.ai.domain.UserPreference;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    List<UserPreference> findByUser(User user);

    Optional<UserPreference> findByUserAndKey(User user, String key);
}
