import { useState } from "react";
import { CheckSquare, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTaskStatus,
} from "@/hooks/useTasks";
import type { Priority, Task, TaskStatus } from "@/types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Completed" },
  { status: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

function formatDue(due: string | null) {
  if (!due) return null;
  return new Date(due).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TaskCard({ task }: { task: Task }) {
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm font-medium", task.status === "COMPLETED" && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <button
          onClick={() => deleteTask.mutate(task.id)}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_STYLES[task.priority])}>
          {task.priority}
        </span>
        {task.category && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{task.category}</span>
        )}
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">Due {formatDue(task.dueDate)}</span>
        )}
      </div>

      {task.subtasks.length > 0 && (
        <ul className="mt-2 space-y-1 border-l pl-2">
          {task.subtasks.map((st) => (
            <li key={st.id} className="text-xs text-muted-foreground">
              • {st.title}
            </li>
          ))}
        </ul>
      )}

      <select
        value={task.status}
        onChange={(e) => updateStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })}
        className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        {COLUMNS.map((c) => (
          <option key={c.status} value={c.status}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TasksPage() {
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const tasks = useTasks({ search: search || undefined });
  const createTask = useCreateTask();

  const grouped = (status: TaskStatus) => (tasks.data ?? []).filter((t) => t.status === status);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    createTask.mutate({ title: value });
    setTitle("");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader title="Tasks" icon={<CheckSquare className="h-5 w-5 text-primary" />} />

      <div className="container py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleAdd} className="flex flex-1 gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task and press Enter..."
            />
            <Button type="submit" disabled={createTask.isPending || !title.trim()}>
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </form>
          <div className="relative sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8"
            />
          </div>
        </div>

        {tasks.isLoading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const items = grouped(col.status);
              return (
                <div key={col.status} className="rounded-xl bg-muted/50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">{col.label}</h2>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {items.length === 0 && (
                      <p className="px-1 py-2 text-xs text-muted-foreground">Nothing here.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
