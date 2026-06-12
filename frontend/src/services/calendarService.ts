import { api } from "./api";
import type { CalendarEvent } from "@/types";

export interface CalendarEventPayload {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
}

export const calendarService = {
  async list(range?: { from: string; to: string }): Promise<CalendarEvent[]> {
    const { data } = await api.get<CalendarEvent[]>("/calendar/events", { params: range });
    return data;
  },

  async create(payload: CalendarEventPayload): Promise<CalendarEvent> {
    const { data } = await api.post<CalendarEvent>("/calendar/events", payload);
    return data;
  },

  async update(id: string, payload: CalendarEventPayload): Promise<CalendarEvent> {
    const { data } = await api.put<CalendarEvent>(`/calendar/events/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/calendar/events/${id}`);
  },
};
