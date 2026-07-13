import { useEffect, useRef, useState } from "react";
import { ChefHat, Send } from "lucide-react";
import { ChatBubble } from "../components/ChatBubble";
import { initialMessages, respond, type ChatMessage, type ConversationState } from "../lib/assistant";
import { RESTAURANT } from "../data/restaurant";
import { useApp } from "../context/AppContext";

export function ChatScreen() {
  const { addToCart, menu, tableNumber } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages());
  const [state, setState] = useState<ConversationState>({ stage: "idle" });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const result = respond(trimmed, state, menu);
      setMessages((prev) => [...prev, ...result.messages]);
      setState(result.state);
      if (result.cartOp) {
        addToCart(result.cartOp.dishId, result.cartOp.qty, result.cartOp.note);
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
            <span className="text-[11px] text-[#8A8272]">Online</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-2.5 py-1 rounded-full shrink-0">
          Table {tableNumber}
        </span>
      </div>

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
            placeholder="e.g. I want something spicy and low-calorie..."
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
