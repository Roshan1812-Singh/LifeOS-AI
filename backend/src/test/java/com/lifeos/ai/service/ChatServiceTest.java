package com.lifeos.ai.service;

import com.lifeos.ai.config.AiProperties;
import com.lifeos.ai.domain.ChatMessage;
import com.lifeos.ai.domain.Conversation;
import com.lifeos.ai.domain.MessageRole;
import com.lifeos.ai.dto.ChatTurnResponse;
import com.lifeos.ai.llm.LlmClient;
import com.lifeos.ai.llm.LlmCompletion;
import com.lifeos.ai.llm.LlmMessage;
import com.lifeos.ai.repository.ChatMessageRepository;
import com.lifeos.ai.repository.ConversationRepository;
import com.lifeos.common.exception.ApiException;
import com.lifeos.user.User;
import com.lifeos.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private ChatMessageRepository messageRepository;
    @Mock private PreferenceService preferenceService;
    @Mock private LlmClient llmClient;
    @Mock private UserRepository userRepository;

    private ChatService chatService;
    private User user;
    private Conversation conversation;
    private final UUID conversationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // record with nulls -> compact constructor fills sensible defaults
        AiProperties properties = new AiProperties(null, "test-key", null, null, null, null, null, null);
        chatService = new ChatService(conversationRepository, messageRepository, preferenceService,
                llmClient, properties, userRepository);

        user = User.createLocal("Tester", "tester@example.com", null, "hash");
        conversation = new Conversation(user, "New conversation");

        lenient().when(userRepository.getReferenceById(any())).thenReturn(user);
    }

    @Test
    void sendMessagePersistsBothMessagesAndReturnsReply() {
        when(llmClient.isAvailable()).thenReturn(true);
        when(conversationRepository.findByPublicIdAndUser(eq(conversationId), any()))
                .thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messageRepository.findByConversationOrderByCreatedAtDesc(any(), any()))
                .thenReturn(List.of());
        when(preferenceService.asContextBlock(any())).thenReturn("");
        when(llmClient.complete(anyList()))
                .thenReturn(new LlmCompletion("Sure, I can help with that.", 10, 5));

        ChatTurnResponse response = chatService.sendMessage(user, conversationId, "Hello there");

        assertThat(response.userMessage().content()).isEqualTo("Hello there");
        assertThat(response.assistantMessage().role()).isEqualTo(MessageRole.ASSISTANT);
        assertThat(response.assistantMessage().content()).isEqualTo("Sure, I can help with that.");
        // First user message becomes the conversation title
        assertThat(response.conversation().title()).isEqualTo("Hello there");
        verify(messageRepository, times(2)).save(any(ChatMessage.class));
    }

    @Test
    void sendMessageInjectsPreferencesIntoSystemPrompt() {
        when(llmClient.isAvailable()).thenReturn(true);
        when(conversationRepository.findByPublicIdAndUser(eq(conversationId), any()))
                .thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messageRepository.findByConversationOrderByCreatedAtDesc(any(), any()))
                .thenReturn(List.of());
        when(preferenceService.asContextBlock(any()))
                .thenReturn("Known preferences about the user:\n- reminder_time: after 7 PM\n");
        when(llmClient.complete(anyList())).thenReturn(new LlmCompletion("Done", 1, 1));

        chatService.sendMessage(user, conversationId, "Create a reminder");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<LlmMessage>> captor = ArgumentCaptor.forClass(List.class);
        verify(llmClient).complete(captor.capture());
        List<LlmMessage> prompt = captor.getValue();

        assertThat(prompt.get(0).role()).isEqualTo(LlmMessage.Role.SYSTEM);
        assertThat(prompt.get(0).content()).contains("after 7 PM");
        assertThat(prompt).anyMatch(m -> m.role() == LlmMessage.Role.USER
                && m.content().equals("Create a reminder"));
    }

    @Test
    void sendMessageFailsWhenLlmNotConfigured() {
        when(llmClient.isAvailable()).thenReturn(false);

        assertThatThrownBy(() -> chatService.sendMessage(user, conversationId, "Hi"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not configured");

        verify(messageRepository, never()).save(any());
    }
}
