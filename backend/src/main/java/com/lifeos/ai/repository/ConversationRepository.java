package com.lifeos.ai.repository;

import com.lifeos.ai.domain.Conversation;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);

    Optional<Conversation> findByPublicIdAndUser(UUID publicId, User user);
}
