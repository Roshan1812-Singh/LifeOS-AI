import { api } from "./api";
import type { ChatMessage, ChatTurn, Conversation } from "../types";

export const aiService = {
  async listConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>("/ai/conversations");
    return data;
  },

  async createConversation(title?: string): Promise<Conversation> {
    const { data } = await api.post<Conversation>("/ai/conversations", title ? { title } : {});
    return data;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/ai/conversations/${conversationId}/messages`);
    return data;
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatTurn> {
    const { data } = await api.post<ChatTurn>(`/ai/conversations/${conversationId}/messages`, {
      content,
    });
    return data;
  },
};
