import { api } from "./api";
import type { NotificationChannel, Recurrence, Reminder, ReminderStatus } from "../types";

export interface ReminderPayload {
  title: string;
  notes?: string;
  remindAt: string;
  recurrence?: Recurrence;
  channel?: NotificationChannel;
  locationLabel?: string;
  locationLat?: number;
  locationLng?: number;
}

export const reminderService = {
  async list(status?: ReminderStatus): Promise<Reminder[]> {
    const { data } = await api.get<Reminder[]>("/reminders", {
      params: status ? { status } : {},
    });
    return data;
  },

  async create(payload: ReminderPayload): Promise<Reminder> {
    const { data } = await api.post<Reminder>("/reminders", payload);
    return data;
  },

  async updateStatus(id: string, status: ReminderStatus): Promise<Reminder> {
    const { data } = await api.patch<Reminder>(`/reminders/${id}/status`, null, {
      params: { status },
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
};
