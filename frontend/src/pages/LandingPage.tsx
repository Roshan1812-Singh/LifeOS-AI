import { Link } from "react-router-dom";
import {
  Bot,
  CalendarDays,
  CheckSquare,
  FileText,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const features = [
  { icon: Bot, title: "AI Assistant", desc: "Chat, voice and smart actions that understand you." },
  { icon: CheckSquare, title: "Tasks & Projects", desc: "Plan, prioritise and never miss a deadline." },
  { icon: CalendarDays, title: "Calendar", desc: "Schedule events and reminders effortlessly." },
  { icon: FileText, title: "Document Vault", desc: "Store, search and ask questions about your files." },
  { icon: Wallet, title: "Expense Tracker", desc: "Understand where your money goes." },
  { icon: Sparkles, title: "Learning", desc: "Summaries, flashcards and quizzes from any source." },
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            L
          </span>
          LifeOS AI
        </div>
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/dashboard">Open app</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="container flex flex-col items-center py-20 text-center md:py-28">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Your personal AI operating system
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            One assistant for your whole life
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            LifeOS AI helps students, professionals, families and businesses manage tasks,
            reminders, documents, expenses and learning — all in one place, powered by AI.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" asChild>
              <Link to="/register">Start for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="container grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-sm">
              <Icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LifeOS AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
