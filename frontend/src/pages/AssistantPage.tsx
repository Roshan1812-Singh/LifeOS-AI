import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, Loader2, Plus, Send, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useCreateConversation,
  useMessages,
  useSendMessage,
} from "@/hooks/useChat";

export function AssistantPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = useConversations();
  const createConversation = useCreateConversation();
  const messages = useMessages(activeId);
  const sendMessage = useSendMessage(activeId);

  // Auto-select the most recent conversation once loaded.
  useEffect(() => {
    if (!activeId && conversations.data && conversations.data.length > 0) {
      setActiveId(conversations.data[0].id);
    }
  }, [activeId, conversations.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.data, sendMessage.isPending]);

  const handleNewChat = async () => {
    const conversation = await createConversation.mutateAsync(undefined);
    setActiveId(conversation.id);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;

    let conversationId = activeId;
    if (!conversationId) {
      const conversation = await createConversation.mutateAsync(undefined);
      conversationId = conversation.id;
      setActiveId(conversationId);
    }
    setDraft("");
    sendMessage.mutate(content);
  };

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-semibold">AI Assistant</span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Conversation list */}
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-background md:flex">
          <div className="p-3">
            <Button
              className="w-full"
              onClick={handleNewChat}
              disabled={createConversation.isPending}
            >
              <Plus className="h-4 w-4" /> New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {conversations.data?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "mb-1 w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  c.id === activeId && "bg-accent font-medium",
                )}
              >
                {c.title}
              </button>
            ))}
            {conversations.data?.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</p>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {(!activeId || messages.data?.length === 0) && !sendMessage.isPending && (
                <div className="mt-16 text-center text-muted-foreground">
                  <Bot className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <p className="text-lg font-medium text-foreground">How can I help you today?</p>
                  <p className="mt-1 text-sm">
                    Ask me to create reminders, summarise notes, plan your day, and more.
                  </p>
                </div>
              )}

              {messages.data?.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-3",
                    m.role === "USER" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      m.role === "USER"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {m.role === "USER" ? (
                      <UserIcon className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                      m.role === "USER"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {sendMessage.isPending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center rounded-2xl border bg-background px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-background p-4">
            <form
              className="mx-auto flex max-w-2xl items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Message LifeOS AI..."
                className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMessage.isPending || !draft.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
