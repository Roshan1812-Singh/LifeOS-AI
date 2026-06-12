import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bell,
  Bot,
  CalendarDays,
  CheckSquare,
  FileText,
  GraduationCap,
  LogOut,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";

interface ModuleCard {
  icon: typeof Bot;
  title: string;
  phase: string;
  to?: string;
}

const modules: ModuleCard[] = [
  { icon: Bot, title: "AI Assistant", phase: "Available now", to: "/assistant" },
  { icon: CheckSquare, title: "Tasks", phase: "Available now", to: "/tasks" },
  { icon: Bell, title: "Reminders", phase: "Available now", to: "/reminders" },
  { icon: CalendarDays, title: "Calendar", phase: "Available now", to: "/calendar" },
  { icon: FileText, title: "Documents", phase: "Available now", to: "/documents" },
  { icon: Wallet, title: "Expenses", phase: "Available now", to: "/expenses" },
  { icon: GraduationCap, title: "Learning", phase: "Phase 6" },
];

export function DashboardPage() {
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useLogout();

  // Verify the session against the backend and refresh the cached profile.
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const me = await authService.me();
      setUser(me);
      return me;
    },
    initialData: storedUser ?? undefined,
  });

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              L
            </span>
            LifeOS AI
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight">Hi {firstName}, welcome back</h1>
        <p className="mt-1 text-muted-foreground">
          Your personal AI workspace. Feature modules unlock as each phase ships.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, phase, to }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-2 h-7 w-7 text-primary" />
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{to ? phase : `Available in ${phase}`}</CardDescription>
              </CardHeader>
              <CardContent>
                {to ? (
                  <Button size="sm" asChild>
                    <Link to={to}>Open</Link>
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled>
                    Coming soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
