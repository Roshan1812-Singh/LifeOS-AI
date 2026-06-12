import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, icon, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Button variant="ghost" size="icon" asChild>
        <Link to="/dashboard" aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      {icon}
      <span className="font-semibold">{title}</span>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
