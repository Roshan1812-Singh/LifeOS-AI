import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { calendarService, type CalendarEventPayload } from "@/services/calendarService";
import { extractErrorMessage } from "@/services/api";

export function useCalendarEvents() {
  return useQuery({
    queryKey: ["calendar"],
    queryFn: () => calendarService.list(),
  });
}

function useInvalidateCalendar() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["calendar"] });
}

export function useCreateEvent() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (payload: CalendarEventPayload) => calendarService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Event created");
    },
    onError: (e) => toast.error(extractErrorMessage(e, "Could not create event")),
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not delete event")),
  });
}
