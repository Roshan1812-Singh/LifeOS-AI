package com.lifeos.ai.service;

import com.lifeos.ai.config.AiProperties;
import com.lifeos.ai.domain.ChatMessage;
import com.lifeos.ai.domain.Conversation;
import com.lifeos.ai.domain.MessageRole;
import com.lifeos.ai.dto.ChatMessageResponse;
import com.lifeos.ai.dto.ChatTurnResponse;
import com.lifeos.ai.dto.ConversationResponse;
import com.lifeos.ai.llm.LlmClient;
import com.lifeos.ai.llm.LlmCompletion;
import com.lifeos.ai.llm.LlmException;
import com.lifeos.ai.llm.LlmMessage;
import com.lifeos.ai.repository.ChatMessageRepository;
import com.lifeos.ai.repository.ConversationRepository;
import com.lifeos.common.exception.ApiException;
import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.user.User;
import com.lifeos.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Orchestrates a chat turn:
 * <ol>
 *   <li>Persists the user's message.</li>
 *   <li>Assembles context = system prompt + long-term memory (preferences)
 *       + short-term memory (recent history within a message budget).</li>
 *   <li>Calls the configured {@link LlmClient}.</li>
 *   <li>Persists and returns the assistant's reply.</li>
 * </ol>
 */
@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final PreferenceService preferenceService;
    private final LlmClient llmClient;
    private final AiProperties properties;
    private final UserRepository userRepository;

    public ChatService(ConversationRepository conversationRepository,
                       ChatMessageRepository messageRepository,
                       PreferenceService preferenceService,
                       LlmClient llmClient,
                       AiProperties properties,
                       UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.preferenceService = preferenceService;
        this.llmClient = llmClient;
        this.properties = properties;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(User user) {
        return conversationRepository.findByUserOrderByUpdatedAtDesc(managed(user)).stream()
                .map(ConversationResponse::from)
                .toList();
    }

    @Transactional
    public ConversationResponse createConversation(User user, String title) {
        Conversation conversation = conversationRepository.save(new Conversation(managed(user), title));
        return ConversationResponse.from(conversation);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(User user, UUID conversationId) {
        Conversation conversation = requireConversation(user, conversationId);
        return messageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .filter(m -> m.getRole() != MessageRole.SYSTEM)
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatTurnResponse sendMessage(User user, UUID conversationId, String content) {
        if (!llmClient.isAvailable()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI is not configured. Set the AI provider API key (e.g. OPENAI_API_KEY) to enable chat.");
        }

        Conversation conversation = requireConversation(user, conversationId);

        ChatMessage userMessage =
                messageRepository.save(new ChatMessage(conversation, MessageRole.USER, content, null));

        List<LlmMessage> prompt = buildPrompt(user, conversation, content);

        LlmCompletion completion;
        try {
            completion = llmClient.complete(prompt);
        } catch (LlmException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI provider could not be reached. Please try again.");
        }

        ChatMessage assistantMessage = messageRepository.save(new ChatMessage(
                conversation, MessageRole.ASSISTANT, completion.content(),
                completion.completionTokens()));

        maybeTitleConversation(conversation, content);

        return new ChatTurnResponse(
                ConversationResponse.from(conversation),
                ChatMessageResponse.from(userMessage),
                ChatMessageResponse.from(assistantMessage));
    }

    private List<LlmMessage> buildPrompt(User user, Conversation conversation, String latestUserContent) {
        List<LlmMessage> prompt = new ArrayList<>();

        StringBuilder system = new StringBuilder(properties.systemPrompt());
        String preferences = preferenceService.asContextBlock(user);
        if (!preferences.isBlank()) {
            system.append("\n\n").append(preferences);
        }
        prompt.add(LlmMessage.system(system.toString()));

        // Short-term memory: most recent messages (excluding the one we just saved),
        // capped by the configured budget and returned in chronological order.
        List<ChatMessage> recent = new ArrayList<>(messageRepository
                .findByConversationOrderByCreatedAtDesc(conversation,
                        PageRequest.of(0, properties.maxHistoryMessages())));
        recent.sort(Comparator.comparing(ChatMessage::getCreatedAt));

        for (ChatMessage m : recent) {
            switch (m.getRole()) {
                case USER -> prompt.add(LlmMessage.user(m.getContent()));
                case ASSISTANT -> prompt.add(LlmMessage.assistant(m.getContent()));
                case SYSTEM -> prompt.add(LlmMessage.system(m.getContent()));
            }
        }
        // Ensure the latest user content is present even if it fell outside the window.
        if (recent.stream().noneMatch(m -> m.getRole() == MessageRole.USER
                && m.getContent().equals(latestUserContent))) {
            prompt.add(LlmMessage.user(latestUserContent));
        }
        return prompt;
    }

    private void maybeTitleConversation(Conversation conversation, String firstUserContent) {
        if ("New conversation".equals(conversation.getTitle())) {
            String trimmed = firstUserContent.strip();
            String title = trimmed.length() > 60 ? trimmed.substring(0, 57) + "..." : trimmed;
            conversation.setTitle(title);
        }
    }

    private Conversation requireConversation(User user, UUID conversationId) {
        return conversationRepository.findByPublicIdAndUser(conversationId, managed(user))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    private User managed(User user) {
        return userRepository.getReferenceById(user.getId());
    }
}
