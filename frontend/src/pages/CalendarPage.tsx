import { useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useCalendarEvents, useCreateEvent, useDeleteEvent } from "@/hooks/useCalendar";
import type { CalendarEvent } from "@/types";

function toIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeRange(e: CalendarEvent) {
  if (e.allDay) return "All day";
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${new Date(e.startTime).toLocaleTimeString(undefined, opts)} – ${new Date(
    e.endTime,
  ).toLocaleTimeString(undefined, opts)}`;
}

export function CalendarPage() {
  const events = useCalendarEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events.data ?? []) {
      const key = dayKey(e.startTime);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return Array.from(map.entries());
  }, [events.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;
    createEvent.mutate(
      {
        title: title.trim(),
        startTime: toIso(startTime),
        endTime: toIso(endTime),
        location: location.trim() || undefined,
        allDay,
      },
      {
        onSuccess: () => {
          setTitle("");
          setStartTime("");
          setEndTime("");
          setLocation("");
          setAllDay(false);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader title="Calendar" icon={<CalendarDays className="h-5 w-5 text-primary" />} />

      <div className="container grid gap-6 py-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">New event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-title">Title</Label>
                <Input id="e-title" value={title} onChange={(ev) => setTitle(ev.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-start">Starts</Label>
                <Input
                  id="e-start"
                  type="datetime-local"
                  value={startTime}
                  onChange={(ev) => setStartTime(ev.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-end">Ends</Label>
                <Input
                  id="e-end"
                  type="datetime-local"
                  value={endTime}
                  onChange={(ev) => setEndTime(ev.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-loc">Location (optional)</Label>
                <Input id="e-loc" value={location} onChange={(ev) => setLocation(ev.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(ev) => setAllDay(ev.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                All day
              </label>
              <Button
                type="submit"
                className="w-full"
                disabled={createEvent.isPending || !title.trim() || !startTime || !endTime}
              >
                {createEvent.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create event
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {events.isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {events.data?.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">No events scheduled.</p>
          )}
          {grouped.map(([day, dayEvents]) => (
            <div key={day}>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{day}</h2>
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border bg-background p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{e.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeRange(e)}
                        </span>
                        {e.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete event"
                      onClick={() => deleteEvent.mutate(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
