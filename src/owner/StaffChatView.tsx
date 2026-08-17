import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, ChevronLeft } from "lucide-react";
import { useChatThreads } from "../store/useChatThreads";
import { useI18n } from "../i18n/I18nContext";
import type { ApiChatMessage, ApiChatThread } from "../lib/apiClient";

function timeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ThreadRow({
  thread,
  active,
  onClick,
  t,
}: {
  thread: ApiChatThread;
  active: boolean;
  onClick: () => void;
  t: (key: import("../i18n/translations").TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-3 border-b border-black/5 transition-colors ${
        active ? "bg-[#E5F3EA]" : "hover:bg-black/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-[13px] font-semibold text-[#22201B] truncate">
          {thread.table_id ? `${t("chat_table")} ${thread.table_id}` : t("staffchatview_unknown_table")}
        </span>
        {thread.needs_reply && <span className="w-2 h-2 rounded-full bg-[#B0553C] shrink-0" />}
      </div>
      <p className="text-[12px] text-[#8A8272] truncate">
        {thread.last_sender === "staff" ? `${t("staffchatview_you")}: ` : ""}
        {thread.last_message}
      </p>
      <p className="text-[10.5px] text-[#B0A794] mt-0.5">{timeShort(thread.last_at)}</p>
    </button>
  );
}

export function StaffChatView() {
  const { threads, loadThread, reply, sending } = useChatThreads();
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const poll = () => {
      loadThread(selected).then((rows) => {
        if (!cancelled) setMessages(rows);
      });
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selected, loadThread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleReply = async () => {
    const trimmed = input.trim();
    if (!trimmed || !selected || sending) return;
    setInput("");
    await reply(selected, trimmed);
    loadThread(selected).then(setMessages);
  };

  const selectedThread = threads.find((th) => th.customer_session_id === selected);

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex">
      {/* Thread list */}
      <div
        className={`w-full md:w-80 shrink-0 border-r border-black/5 bg-white flex flex-col ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-4 py-4 border-b border-black/5">
          <h1 className="text-[17px] font-bold text-[#22201B]">{t("staffchatview_title")}</h1>
          <p className="text-[12px] text-[#8A8272]">{t("staffchatview_subtitle")}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="text-center text-[12.5px] text-[#B0A794] px-6 py-10">{t("staffchatview_empty")}</p>
          )}
          {threads.map((th) => (
            <ThreadRow
              key={th.customer_session_id}
              thread={th}
              active={selected === th.customer_session_id}
              onClick={() => setSelected(th.customer_session_id)}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className={`flex-1 min-w-0 flex-col bg-[#FBF7EF] ${selected ? "flex" : "hidden md:flex"}`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
            <MessageCircle size={28} className="text-[#B0A794]" />
            <p className="text-[13px] text-[#B0A794]">{t("staffchatview_select_prompt")}</p>
          </div>
        ) : (
          <>
            <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-black/5 bg-white">
              <button onClick={() => setSelected(null)} className="md:hidden text-[#5C5240]">
                <ChevronLeft size={20} />
              </button>
              <p className="text-[13.5px] font-bold text-[#22201B]">
                {selectedThread?.table_id
                  ? `${t("chat_table")} ${selectedThread.table_id}`
                  : t("staffchatview_unknown_table")}
              </p>
            </div>
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "staff" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.sender === "staff"
                        ? "bg-[#2D5A3D] text-white rounded-br-sm"
                        : "bg-white border border-black/5 text-[#22201B] rounded-bl-sm"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 px-3 pt-2 pb-3 border-t border-black/5 bg-white">
              <div className="flex items-center gap-2 bg-[#F5F1E6] rounded-full pl-4 pr-1.5 py-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  placeholder={t("staffchatview_reply_placeholder")}
                  className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#B0A794] text-[#22201B]"
                />
                <button
                  onClick={handleReply}
                  disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded-full bg-[#2D5A3D] flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform shrink-0"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
