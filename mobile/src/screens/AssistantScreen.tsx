import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { aiService } from "../services/ai";
import { extractErrorMessage } from "../services/api";
import { speak, stopSpeaking } from "../native/speech";
import { colors, radius, spacing } from "../theme";
import type { ChatMessage } from "../types";

export function AssistantScreen() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: () => aiService.listConversations(),
  });

  useEffect(() => {
    if (!activeId && conversations.data && conversations.data.length > 0) {
      setActiveId(conversations.data[0].id);
    }
  }, [conversations.data, activeId]);

  const messages = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => (activeId ? aiService.getMessages(activeId) : Promise.resolve([])),
    enabled: !!activeId,
  });

  const send = useMutation({
    mutationFn: async (content: string) => {
      let conversationId = activeId;
      if (!conversationId) {
        const convo = await aiService.createConversation();
        conversationId = convo.id;
        setActiveId(conversationId);
      }
      return aiService.sendMessage(conversationId, content);
    },
    onSuccess: (turn) => {
      qc.invalidateQueries({ queryKey: ["messages", turn.conversation.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (speakReplies) {
        speak(turn.assistantMessage.content);
      }
    },
    onError: (e) => setError(extractErrorMessage(e, "The assistant could not reply")),
  });

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setError(null);
    setText("");
    send.mutate(content);
  };

  const toggleSpeak = () => {
    if (speakReplies) {
      stopSpeaking();
    }
    setSpeakReplies((v) => !v);
  };

  const data = messages.data ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>AI Assistant</Text>
        <Pressable onPress={toggleSpeak} style={styles.speakBtn}>
          <Ionicons
            name={speakReplies ? "volume-high" : "volume-mute-outline"}
            size={18}
            color={speakReplies ? colors.primary : colors.muted}
          />
          <Text style={[styles.speakLabel, { color: speakReplies ? colors.primary : colors.muted }]}>
            Speak replies
          </Text>
        </Pressable>
      </View>

      {messages.isLoading && activeId ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.hint}>
              Ask me to plan your day, summarize notes, or answer questions.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.role === "USER";
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleAi]}>
                <Text style={[styles.bubbleText, mine && { color: colors.primaryText }]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message the assistant..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, { opacity: send.isPending || !text.trim() ? 0.5 : 1 }]}
          onPress={handleSend}
          disabled={send.isPending || !text.trim()}
        >
          {send.isPending ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Ionicons name="send" size={18} color={colors.primaryText} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  toolbarText: { fontWeight: "700", color: colors.text },
  speakBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  speakLabel: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  messages: { padding: spacing.lg, gap: spacing.sm },
  hint: { color: colors.muted, textAlign: "center", marginTop: spacing.xxl },
  bubble: { maxWidth: "85%", padding: spacing.md, borderRadius: radius.md },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.primary },
  bubbleAi: { alignSelf: "flex-start", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.text },
  error: { color: colors.danger, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === "ios" ? spacing.md : spacing.sm,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
