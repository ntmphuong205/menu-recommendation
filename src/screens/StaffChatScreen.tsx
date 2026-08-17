import { useEffect, useRef, useState } from "react";
import { Send, Store } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";
import { getCustomerSessionId } from "../lib/apiClient";
import { useChatMessages } from "../store/useChatMessages";
import { RESTAURANT } from "../data/restaurant";

/** Real two-way messaging with restaurant staff — separate from the AI
 *  assistant tab (ChatScreen), which only answers from the menu and never
 *  reaches an actual person. Staff reply from OrdersView's chat inbox. */
export function StaffChatScreen() {
  const { tableId, mode } = useApp();
  const { t } = useI18n();
  const sessionId = getCustomerSessionId();
  const { messages, sendMessage, sending } = useChatMessages(sessionId, mode === "store" ? tableId : null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput("");
    sendMessage(trimmed).catch(() => setInput(trimmed));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-2.5 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF]">
        <div className="w-9 h-9 rounded-full bg-[#1F3D2B] flex items-center justify-center">
          <Store size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[#22201B] leading-tight">{RESTAURANT.name}</p>
          <p className="text-[11px] text-[#8A8272]">{t("staffchat_subtitle")}</p>
        </div>
        <LangSwitcher />
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-[#B0A794] mt-8 px-6 leading-relaxed">
            {t("staffchat_empty")}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.sender === "customer"
                  ? "bg-[#2D5A3D] text-white rounded-br-sm"
                  : "bg-white border border-black/5 text-[#22201B] rounded-bl-sm"
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 px-3 pt-2 pb-3 border-t border-black/5 bg-[#FBF7EF]">
        <div className="flex items-center gap-2 bg-white rounded-full pl-4 pr-1.5 py-1.5 border border-black/10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("staffchat_placeholder")}
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#B0A794] text-[#22201B]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-8 h-8 rounded-full bg-[#2D5A3D] flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
