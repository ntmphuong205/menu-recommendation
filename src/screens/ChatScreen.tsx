import { useEffect, useRef, useState } from "react";
import { ChefHat, Send } from "lucide-react";
import { ChatBubble } from "../components/ChatBubble";
import { initialMessages, respond, botMessage, type ChatMessage, type ConversationState } from "../lib/assistant";
import { getAiChatReply } from "../lib/aiClient";
import { RESTAURANT } from "../data/restaurant";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";
import { OrderModeNotice } from "../components/OrderModeNotice";
import { StoreClosedBanner } from "../components/StoreClosedBanner";

export function ChatScreen() {
  const { addToCart, menu, tableId, mode, webOrderIntent, isStoreOpen } = useApp();
  const { t, lang } = useI18n();
  const canOrder = (mode === "store" || webOrderIntent === "pickup") && isStoreOpen;
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages(lang));
  const [state, setState] = useState<ConversationState>({ stage: "idle" });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // The greeting is created once on mount (often before the customer picks a
  // language on the Welcome screen). Re-generate it in the new language as
  // long as nothing has actually been said yet — once the customer has sent
  // a message, leave the conversation history alone.
  useEffect(() => {
    setMessages((prev) => (prev.some((m) => m.from === "user") ? prev : initialMessages(lang)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, from: "user", text: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setTyping(true);

    setTimeout(async () => {
      // The backend's Gemini-grounded /api/chat handles the message first —
      // it sees the live menu/table data and answers accordingly, and (told
      // the real mode/webOrderIntent) only ever suggests dishes when
      // canOrder is true. It never adds to the cart itself, only suggests;
      // getAiChatReply() resolves to null on any failure (no GEMINI_API_KEY
      // configured, network error, etc.), and the rule-based engine below is
      // the complete offline fallback either way.
      const ai = await getAiChatReply(trimmed, lang, messages, mode, webOrderIntent);
      if (ai) {
        const dishes = ai.dishIds.map((id) => menu.find((d) => d.id === id)).filter((d): d is NonNullable<typeof d> => !!d);
        setMessages((prev) => [...prev, botMessage(ai.reply, dishes.length > 0 ? dishes : undefined)]);
        setTyping(false);
        return;
      }

      const result = respond(trimmed, state, menu, lang);
      if (result.cartOp && !canOrder) {
        // respond()'s own messages for this turn assume the add succeeded
        // ("Added X to your cart...") — showing those while silently not
        // adding anything would be a lie, so swap in the same blocked
        // explanation DishSheet/DishCard show instead, and drop the
        // half-finished order-taking state rather than leaving it stuck
        // waiting for a qty/note that will never get anywhere.
        setMessages((prev) => [...prev, botMessage(t("reservation_web_mode_blocked"))]);
        setState({ stage: "idle" });
        setTyping(false);
        return;
      }
      setMessages((prev) => [...prev, ...result.messages]);
      setState(result.state);
      if (result.cartOp) {
        // Chat only ever adds to the customer's cart — placing the real order
        // happens explicitly from the Cart tab's confirm button. It can't
        // ask which size/flavor, so a dish with those choices defaults to
        // the first one of each (toppings default to none) — remove it
        // from the cart and re-add via Menu to change any of that.
        const dish = menu.find((d) => d.id === result.cartOp!.dishId);
        addToCart(
          result.cartOp.dishId,
          result.cartOp.qty,
          result.cartOp.note,
          dish?.sizeVariants?.[0]?.id,
          dish?.flavorVariants?.[0]?.id
        );
      }
      setTyping(false);
    }, 500 + Math.random() * 350);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF]">
        <div className="w-9 h-9 rounded-full bg-[#2D5A3D] flex items-center justify-center">
          <ChefHat size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[#22201B] leading-tight">{RESTAURANT.name} · Menu AI</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
            <span className="text-[11px] text-[#8A8272]">{t("chat_online")}</span>
          </div>
        </div>
        {mode === "store" && (
          <span className="text-[11px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-2.5 py-1 rounded-full shrink-0">
            {t("chat_table")} {tableId}
          </span>
        )}
        <LangSwitcher />
      </div>

      <OrderModeNotice />
      <StoreClosedBanner />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} onQuickReply={send} />
        ))}
        {typing && (
          <div className="flex items-center gap-1.5 pl-9">
            <div className="flex gap-1 bg-white border border-black/5 rounded-full px-3 py-2 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#B8AF9C] animate-typing-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pt-2 pb-3 border-t border-black/5 bg-[#FBF7EF]">
        <div className="flex items-center gap-2 bg-white rounded-full pl-4 pr-1.5 py-1.5 border border-black/10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={t("chat_placeholder")}
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#B0A794] text-[#22201B]"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full bg-[#2D5A3D] flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
