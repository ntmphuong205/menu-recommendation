import { ChefHat } from "lucide-react";
import type { ChatMessage } from "../lib/assistant";
import { DishCard } from "./DishCard";

export function ChatBubble({ message, onQuickReply }: { message: ChatMessage; onQuickReply: (text: string) => void }) {
  const isBot = message.from === "bot";

  return (
    <div className={`flex gap-2 animate-bubble-in ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-[#2D5A3D] flex items-center justify-center shrink-0 mt-0.5">
          <ChefHat size={14} className="text-white" />
        </div>
      )}
      <div className={`flex flex-col gap-2 ${isBot ? "items-start" : "items-end"} max-w-[78%]`}>
        {message.text && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-snug whitespace-pre-line ${
              isBot
                ? "bg-white text-[#2A2721] rounded-tl-sm shadow-sm border border-black/5"
                : "bg-[#2D5A3D] text-white rounded-tr-sm"
            }`}
          >
            {message.text}
          </div>
        )}
        {message.dishes && message.dishes.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-full -mx-0.5 px-0.5">
            {message.dishes.map((d) => (
              <DishCard key={d.id} dish={d} variant="chat" />
            ))}
          </div>
        )}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => onQuickReply(qr)}
                className="px-3 py-1.5 rounded-full bg-[#EFE9D8] text-[#4A4535] text-[12px] font-medium active:scale-95 transition-transform"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
