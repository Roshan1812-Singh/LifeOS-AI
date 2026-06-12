package com.lifeos.ai.repository;

import com.lifeos.ai.domain.ChatMessage;
import com.lifeos.ai.domain.Conversation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    /**
     * Most recent messages first; used to build short-term memory within a token budget.
     */
    List<ChatMessage> findByConversationOrderByCreatedAtDesc(Conversation conversation,
                                                             Pageable pageable);
}
