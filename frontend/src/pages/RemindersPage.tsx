import { useState } from "react";
import { Bell, Check, Loader2, MapPin, Plus, Repeat, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  useCreateReminder,
  useDeleteReminder,
  useReminders,
  useUpdateReminderStatus,
} from "@/hooks/useReminders";
import type { NotificationChannel, Recurrence } from "@/types";

const RECURRENCES: Recurrence[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const CHANNELS: NotificationChannel[] = ["PUSH", "EMAIL", "BOTH"];

function toIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RemindersPage() {
  const reminders = useReminders();
  const createReminder = useCreateReminder();
  const updateStatus = useUpdateReminderStatus();
  const deleteReminder = useDeleteReminder();

  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("NONE");
  const [channel, setChannel] = useState<NotificationChannel>("PUSH");
  const [locationLabel, setLocationLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !remindAt) return;
    createReminder.mutate(
      {
        title: title.trim(),
        remindAt: toIso(remindAt),
        recurrence,
        channel,
        locationLabel: locationLabel.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setRemindAt("");
          setRecurrence("NONE");
          setChannel("PUSH");
          setLocationLabel("");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader title="Reminders" icon={<Bell className="h-5 w-5 text-primary" />} />

      <div className="container grid gap-6 py-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">New reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-title">Title</Label>
                <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-when">When</Label>
                <Input
                  id="r-when"
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="r-rec">Repeat</Label>
                  <select
                    id="r-rec"
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {RECURRENCES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-chan">Notify via</Label>
                  <select
                    id="r-chan"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as NotificationChannel)}
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0) + c.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-loc">Location (optional)</Label>
                <Input
                  id="r-loc"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="e.g. Office"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createReminder.isPending || !title.trim() || !remindAt}
              >
                {createReminder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create reminder
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {reminders.isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {reminders.data?.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">No reminders yet.</p>
          )}
          {reminders.data?.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <div className="flex-1">
                <p className="font-medium">{r.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatWhen(r.remindAt)}</span>
                  {r.recurrence !== "NONE" && (
                    <span className="inline-flex items-center gap-1">
                      <Repeat className="h-3 w-3" /> {r.recurrence.toLowerCase()}
                    </span>
                  )}
                  {r.locationLabel && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {r.locationLabel}
                    </span>
                  )}
                  <span className="rounded-full bg-secondary px-2 py-0.5">{r.status}</span>
                </div>
              </div>
              {r.status === "ACTIVE" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Mark complete"
                    onClick={() => updateStatus.mutate({ id: r.id, status: "COMPLETED" })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Cancel reminder"
                    onClick={() => updateStatus.mutate({ id: r.id, status: "CANCELLED" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete reminder"
                onClick={() => deleteReminder.mutate(r.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
