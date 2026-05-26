"use client";

import { AlertCircle, CheckCheck, Clock, Mic, Search, Send } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { whatsappContent } from "@/content/apps/whatsapp";
import { useAnalytics } from "@/lib/analytics/use-analytics";

type WhatsAppMessage = (typeof whatsappContent.chats)[number]["messages"][number];
type LocalWhatsAppMessage = WhatsAppMessage & { local?: boolean };

function formatNow() {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: false }).format(new Date());
}

export function WhatsAppApp() {
  const [chatId, setChatId] = useState(whatsappContent.chats[0].id);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<string, LocalWhatsAppMessage[]>>({});
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { track } = useAnalytics();
  const chat = whatsappContent.chats.find((item) => item.id === chatId) ?? whatsappContent.chats[0];
  const messages = useMemo(
    () => [...chat.messages, ...(localMessages[chat.id] ?? [])],
    [chat.id, chat.messages, localMessages],
  );
  const visibleChats = useMemo(
    () =>
      whatsappContent.chats.filter((item) =>
        `${item.name} ${item.lastMessage}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  function updateLocalMessage(messageId: string, patch: Partial<LocalWhatsAppMessage>) {
    setLocalMessages((value) => ({
      ...value,
      [chat.id]: (value[chat.id] ?? []).map((message) =>
        message.id === messageId ? { ...message, ...patch } : message,
      ),
    }));
  }

  function sendDraft() {
    const body = draft.trim();
    if (!body) return;

    const id = `local-${Date.now()}`;
    const message: LocalWhatsAppMessage = {
      id,
      from: "me",
      type: "text",
      body,
      time: formatNow(),
      status: "pending",
      local: true,
    };
    setLocalMessages((value) => ({ ...value, [chat.id]: [...(value[chat.id] ?? []), message] }));
    setDraft("");
    track({ eventType: "WHATSAPP_MESSAGE_SENT_LOCALLY", appId: "whatsapp", metadata: { chatId: chat.id } });

    window.setTimeout(() => updateLocalMessage(id, { status: "read" }), 900);
  }

  function retryMessage(message: WhatsAppMessage) {
    if ("local" in message && message.local) {
      updateLocalMessage(message.id, { status: "pending" });
      window.setTimeout(() => updateLocalMessage(message.id, { status: "read" }), 900);
    }
    track({ eventType: "WHATSAPP_FAILED_SEND_ATTEMPTED", appId: "whatsapp", metadata: { messageId: message.id } });
  }

  return (
    <div className="grid h-full grid-cols-[320px_1fr] bg-[#efeae2] text-slate-950">
      <aside className="border-r border-black/10 bg-white">
        <header className="flex h-16 items-center gap-3 bg-[#f0f2f5] px-4">
          <div className="grid size-10 place-items-center rounded-full bg-emerald-700 text-white">N</div>
          <div className="flex-1" />
          <button type="button" onClick={() => searchRef.current?.focus()} className="rounded-full p-2 hover:bg-black/5" aria-label="Focus chat search">
            <Search className="size-5" />
          </button>
        </header>
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f2f5] px-3 py-2 text-sm">
            <Search className="size-4 text-slate-500" />
            <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search or start new chat" className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
        </div>
        <div>
          {visibleChats.map((item) => {
            const latestLocal = localMessages[item.id]?.at(-1);
            return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setChatId(item.id);
                track({ eventType: "WHATSAPP_CHAT_OPENED", appId: "whatsapp", metadata: { chatId: item.id } });
              }}
              className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-black/5 ${chatId === item.id ? "bg-[#f0f2f5]" : ""}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-700 font-semibold text-white">
                {item.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between gap-2">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-xs text-slate-500">{latestLocal?.time ?? item.time}</span>
                </span>
                <span className="block truncate text-sm text-slate-500">{latestLocal?.body ?? item.lastMessage}</span>
              </span>
            </button>
            );
          })}
          {!visibleChats.length ? (
            <p className="px-4 py-5 text-sm text-slate-500">No chats found.</p>
          ) : null}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-black/10 bg-[#f0f2f5] px-4">
          <div className="grid size-10 place-items-center rounded-full bg-emerald-700 font-semibold text-white">{chat.avatar}</div>
          <div>
            <h1 className="font-semibold">{chat.name}</h1>
            <p className="text-xs text-slate-500">last seen today at 10:42</p>
          </div>
        </header>

        <div className="flex-1 space-y-2 overflow-auto bg-[radial-gradient(circle_at_top_left,#ffffff80,transparent_30%)] p-6">
          {messages.map((message) => {
            const mine = message.from === "me";
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[64%] rounded-lg px-3 py-2 text-sm shadow-sm ${mine ? "bg-[#d9fdd3]" : "bg-white"}`}>
                  {message.type === "voice" ? (
                    <span className="flex items-center gap-2">
                      <Mic className="size-4 text-emerald-700" />
                      Voice note {message.body}
                    </span>
                  ) : message.type === "deleted" ? (
                    <span className="italic text-slate-500">{message.body}</span>
                  ) : message.type === "media" ? (
                    <span className="block rounded bg-slate-200 px-10 py-8 text-center text-slate-500">Photo</span>
                  ) : (
                    message.body
                  )}
                  <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                    {message.time}
                    {message.status === "failed" ? (
                      <button
                        type="button"
                        onClick={() => retryMessage(message)}
                        className="text-red-500"
                        title="Tap to retry"
                      >
                        <AlertCircle className="size-3" />
                      </button>
                    ) : message.status === "read" ? (
                      <CheckCheck className="size-3 text-sky-500" />
                    ) : (
                      <Clock className="size-3" />
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="flex h-16 items-center gap-3 bg-[#f0f2f5] px-4">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message"
            className="h-11 flex-1 rounded-full bg-white px-4 outline-none"
          />
          <button
            type="button"
            onClick={sendDraft}
            disabled={!draft}
            className="grid size-11 place-items-center rounded-full bg-emerald-600 text-white disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </footer>
      </section>
    </div>
  );
}
