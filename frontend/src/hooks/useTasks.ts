import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  taskService,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from "@/services/taskService";
import { extractErrorMessage } from "@/services/api";
import type { TaskStatus } from "@/types";

export function useTasks(filters: { status?: TaskStatus; search?: string }) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => taskService.list(filters),
  });
}

function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["tasks"] });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Task created");
    },
    onError: (e) => toast.error(extractErrorMessage(e, "Could not create task")),
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      taskService.update(id, payload),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not update task")),
  });
}

export function useUpdateTaskStatus() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateStatus(id, status),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not update status")),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => taskService.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not delete task")),
  });
}
