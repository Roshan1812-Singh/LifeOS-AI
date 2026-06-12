package com.lifeos.ai.web;

import com.lifeos.ai.dto.ChatMessageResponse;
import com.lifeos.ai.dto.ChatTurnResponse;
import com.lifeos.ai.dto.ConversationResponse;
import com.lifeos.ai.dto.CreateConversationRequest;
import com.lifeos.ai.dto.SendMessageRequest;
import com.lifeos.ai.service.ChatService;
import com.lifeos.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/conversations")
@Tag(name = "AI Assistant", description = "Conversational AI with short and long-term memory")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    @Operation(summary = "List the current user's conversations")
    public List<ConversationResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return chatService.listConversations(principal.getUser());
    }

    @PostMapping
    @Operation(summary = "Create a new conversation")
    public ResponseEntity<ConversationResponse> create(
            @AuthenticationPrincipal AppUserDetails principal,
            @Valid @RequestBody(required = false) CreateConversationRequest request) {
        String title = request != null ? request.title() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.createConversation(principal.getUser(), title));
    }

    @GetMapping("/{conversationId}/messages")
    @Operation(summary = "Get the messages of a conversation")
    public List<ChatMessageResponse> messages(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable UUID conversationId) {
        return chatService.getMessages(principal.getUser(), conversationId);
    }

    @PostMapping("/{conversationId}/messages")
    @Operation(summary = "Send a message and receive the assistant's reply")
    public ChatTurnResponse send(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        return chatService.sendMessage(principal.getUser(), conversationId, request.content());
    }
}
