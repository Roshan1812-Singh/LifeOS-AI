import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiService } from "@/services/aiService";
import { extractErrorMessage } from "@/services/api";
import type { ChatMessage, ChatTurn } from "@/types";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: aiService.listConversations,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => aiService.getMessages(conversationId as string),
    enabled: Boolean(conversationId),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => aiService.createConversation(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not create conversation")),
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => aiService.sendMessage(conversationId as string, content),
    onMutate: async (content: string) => {
      if (!conversationId) return;
      await qc.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = qc.getQueryData<ChatMessage[]>(["messages", conversationId]) ?? [];
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessage[]>(["messages", conversationId], [...previous, optimistic]);
      return { previous };
    },
    onError: (error, _content, context) => {
      if (conversationId && context?.previous) {
        qc.setQueryData(["messages", conversationId], context.previous);
      }
      toast.error(extractErrorMessage(error, "The assistant could not respond"));
    },
    onSuccess: (turn: ChatTurn) => {
      if (!conversationId) return;
      qc.setQueryData<ChatMessage[]>(["messages", conversationId], (old) => {
        const withoutOptimistic = (old ?? []).filter((m) => !m.id.startsWith("optimistic-"));
        return [...withoutOptimistic, turn.userMessage, turn.assistantMessage];
      });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
