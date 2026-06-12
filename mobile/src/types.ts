export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

// ---- AI ----
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ChatTurn {
  conversation: Conversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

// ---- Tasks ----
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  category: string | null;
  dueDate: string | null;
  position: number;
  projectId: string | null;
  parentId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: Task[];
}

// ---- Reminders ----
export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type NotificationChannel = "PUSH" | "EMAIL" | "BOTH";
export type ReminderStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  remindAt: string;
  recurrence: Recurrence;
  channel: NotificationChannel;
  status: ReminderStatus;
  locationLabel: string | null;
  locationLat: number | null;
  locationLng: number | null;
  lastFiredAt: string | null;
  createdAt: string;
}

// ---- Calendar ----
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

// ---- Documents ----
export type DocumentCategory =
  | "BILL"
  | "INSURANCE"
  | "CERTIFICATE"
  | "ID_DOCUMENT"
  | "RECEIPT"
  | "BANK_STATEMENT"
  | "MEDICAL"
  | "EDUCATION"
  | "TAX"
  | "CONTRACT"
  | "OTHER";

export type DocumentStatus = "PROCESSING" | "READY" | "FAILED";

export interface DocumentItem {
  id: string;
  title: string;
  originalName: string;
  contentType: string | null;
  sizeBytes: number;
  category: DocumentCategory;
  status: DocumentStatus;
  textChars: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface AskSource {
  id: string;
  title: string;
  category: DocumentCategory;
}

export interface AskResponse {
  answer: string;
  sources: AskSource[];
}

// ---- Expenses ----
export type ExpenseType = "INCOME" | "EXPENSE";

export type ExpenseCategory =
  | "FOOD"
  | "TRAVEL"
  | "SHOPPING"
  | "BILLS"
  | "EDUCATION"
  | "HEALTH"
  | "ENTERTAINMENT"
  | "RENT"
  | "GROCERIES"
  | "SALARY"
  | "BUSINESS"
  | "INVESTMENT"
  | "GIFT"
  | "OTHER";

export interface Transaction {
  id: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note: string | null;
  occurredOn: string;
  createdAt: string;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  percentage: number;
}

export interface ExpenseSummary {
  from: string;
  to: string;
  currency: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  topExpenseCategory: ExpenseCategory | null;
  expenseByCategory: CategoryBreakdown[];
}

export interface ExpenseInsights {
  analysis: string;
}
