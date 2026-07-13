import { useState } from "react";
import { Clock, MapPin, Star, ChevronDown, MessageCircle } from "lucide-react";
import { RESTAURANT, FAQ } from "../data/restaurant";
import { MENU, BEST_SELLERS } from "../data/menu";
import { DishCard } from "../components/DishCard";
import { useApp } from "../context/AppContext";

export function InfoScreen() {
  const { setActiveTab } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const bestSellers = MENU.filter((d) => BEST_SELLERS.includes(d.id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="h-28 bg-gradient-to-br from-[#2D5A3D] to-[#1F3D2B] flex items-end px-4 pb-4">
          <div>
            <h1 className="text-[20px] font-bold text-white">{RESTAURANT.name}</h1>
            <p className="text-[12px] text-white/80">{RESTAURANT.tagline}</p>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-[#E0A83C] fill-[#E0A83C]" />
            <span className="text-[13px] font-semibold text-[#22201B]">{RESTAURANT.rating}</span>
            <span className="text-[12px] text-[#8A8272]">
              ({RESTAURANT.reviewCount} reviews) · {RESTAURANT.cuisine}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-black/5 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
              <div className="text-[12.5px] text-[#5C5240]">
                {RESTAURANT.hours.map((h) => (
                  <p key={h.day}>
                    <span className="font-medium text-[#22201B]">{h.day}: </span>
                    {h.time}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-[#5C5240]">{RESTAURANT.address}</p>
            </div>
          </div>

          <div>
            <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-2">Best Sellers</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {bestSellers.map((d) => (
                <DishCard key={d.id} dish={d} variant="chat" />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-2">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-2">
              {FAQ.map((item, i) => (
                <div key={item.question} className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-3.5 py-3 text-left"
                  >
                    <span className="text-[12.5px] font-medium text-[#22201B] pr-2">{item.question}</span>
                    <ChevronDown
                      size={15}
                      className={`text-[#B0A794] shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="px-3.5 pb-3 text-[12px] text-[#5C5240] leading-relaxed">{item.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("chat")}
            className="flex items-center justify-center gap-2 w-full bg-[#2D5A3D] text-white font-semibold text-[13px] py-3 rounded-full active:scale-[0.98] transition-transform mt-1"
          >
            <MessageCircle size={15} />
            Ask more via Chat
          </button>
        </div>
      </div>
    </div>
  );
}
