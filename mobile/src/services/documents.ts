import { api } from "./api";
import type { AskResponse, DocumentItem } from "../types";

export interface UploadFile {
  uri: string;
  name: string;
  mimeType?: string;
}

export const documentService = {
  async list(): Promise<DocumentItem[]> {
    const { data } = await api.get<DocumentItem[]>("/documents");
    return data;
  },

  async search(q: string): Promise<DocumentItem[]> {
    const { data } = await api.get<DocumentItem[]>("/documents/search", { params: { q } });
    return data;
  },

  async upload(file: UploadFile, title?: string): Promise<DocumentItem> {
    const form = new FormData();
    // React Native FormData accepts a { uri, name, type } object for files.
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? "application/octet-stream",
    } as unknown as Blob);
    if (title) {
      form.append("title", title);
    }
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
};
