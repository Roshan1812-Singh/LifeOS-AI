import { api } from "./api";
import type { AskResponse, DocumentCategory, DocumentItem } from "@/types";

export const documentService = {
  async list(category?: DocumentCategory): Promise<DocumentItem[]> {
    const { data } = await api.get<DocumentItem[]>("/documents", {
      params: category ? { category } : {},
    });
    return data;
  },

  async search(q: string): Promise<DocumentItem[]> {
    const { data } = await api.get<DocumentItem[]>("/documents/search", { params: { q } });
    return data;
  },

  async upload(file: File, title?: string): Promise<DocumentItem> {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    const { data } = await api.post<DocumentItem>("/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async ask(question: string): Promise<AskResponse> {
    const { data } = await api.post<AskResponse>("/documents/ask", { question });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async download(id: string, filename: string): Promise<void> {
    const response = await api.get(`/documents/${id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
