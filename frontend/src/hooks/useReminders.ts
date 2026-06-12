import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reminderService, type ReminderPayload } from "@/services/reminderService";
import { extractErrorMessage } from "@/services/api";
import type { ReminderStatus } from "@/types";

export function useReminders(status?: ReminderStatus) {
  return useQuery({
    queryKey: ["reminders", status ?? "all"],
    queryFn: () => reminderService.list(status),
  });
}

function useInvalidateReminders() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["reminders"] });
}

export function useCreateReminder() {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (payload: ReminderPayload) => reminderService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Reminder created");
    },
    onError: (e) => toast.error(extractErrorMessage(e, "Could not create reminder")),
  });
}

export function useUpdateReminderStatus() {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReminderStatus }) =>
      reminderService.updateStatus(id, status),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not update reminder")),
  });
}

export function useDeleteReminder() {
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (id: string) => reminderService.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not delete reminder")),
  });
}
