import { api } from "./api";
import type { Priority, Task, TaskStatus } from "@/types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
  projectId?: string;
  parentId?: string;
}

export interface UpdateTaskPayload {
  title: string;
  description?: string | null;
  priority?: Priority;
  status?: TaskStatus;
  category?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
}

export const taskService = {
  async list(params?: { status?: TaskStatus; search?: string }): Promise<Task[]> {
    const { data } = await api.get<Task[]>("/tasks", { params });
    return data;
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await api.post<Task>("/tasks", payload);
    return data;
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await api.put<Task>(`/tasks/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${id}/status`, { status });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
