import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { TasksPage } from "@/pages/TasksPage";
import { RemindersPage } from "@/pages/RemindersPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
