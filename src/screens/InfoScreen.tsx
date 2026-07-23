import { useState } from "react";
import { Clock, MapPin, Star, ChevronDown, MessageCircle, Bell } from "lucide-react";
import { RESTAURANT, FAQ, getRestaurantText, getHoursLabel, getFaqText } from "../data/restaurant";
import { BEST_SELLERS } from "../data/menu";
import { DishCard } from "../components/DishCard";
import { CallStaffModal } from "../components/CallStaffModal";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

export function InfoScreen() {
  const { setActiveTab, menu } = useApp();
  const { t, lang } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCallStaff, setShowCallStaff] = useState(false);
  const bestSellers = menu.filter((d) => BEST_SELLERS.includes(d.id));
  const restaurantText = getRestaurantText(lang);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="h-28 bg-gradient-to-br from-[#2D5A3D] to-[#1F3D2B] flex items-end px-4 pb-4">
          <div>
            <h1 className="text-[20px] font-bold text-white">{RESTAURANT.name}</h1>
            <p className="text-[12px] text-white/80">{restaurantText.tagline}</p>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-[#E0A83C] fill-[#E0A83C]" />
            <span className="text-[13px] font-semibold text-[#22201B]">{RESTAURANT.rating}</span>
            <span className="text-[12px] text-[#8A8272]">
              ({t("info_reviews_count", { count: RESTAURANT.reviewCount })}) · {restaurantText.cuisine}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-black/5 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
              <div className="text-[12.5px] text-[#5C5240]">
                {RESTAURANT.hours.map((h) => {
                  const label = getHoursLabel(h, lang);
                  return (
                    <p key={h.day}>
                      <span className="font-medium text-[#22201B]">{label.day}: </span>
                      {label.time}
                    </p>
                  );
                })}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-[#5C5240]">{restaurantText.address}</p>
            </div>
          </div>

          <div>
            <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-2">{t("info_best_sellers")}</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {bestSellers.map((d) => (
                <DishCard key={d.id} dish={d} variant="chat" />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-2">{t("info_faq")}</h2>
            <div className="flex flex-col gap-2">
              {FAQ.map((item, i) => {
                const faqText = getFaqText(item, lang);
                return (
                  <div key={item.question} className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-left"
                    >
                      <span className="text-[12.5px] font-medium text-[#22201B] pr-2">{faqText.question}</span>
                      <ChevronDown
                        size={15}
                        className={`text-[#B0A794] shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openFaq === i && (
                      <p className="px-3.5 pb-3 text-[12px] text-[#5C5240] leading-relaxed">{faqText.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setActiveTab("chat")}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2D5A3D] text-white font-semibold text-[13px] py-3 rounded-full active:scale-[0.98] transition-transform"
            >
              <MessageCircle size={15} />
              {t("info_ask_chat")}
            </button>
            <button
              onClick={() => setShowCallStaff(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 text-[#22201B] font-semibold text-[13px] py-3 rounded-full active:scale-[0.98] transition-transform"
            >
              <Bell size={15} />
              {t("info_call_staff")}
            </button>
          </div>
        </div>
      </div>

      {showCallStaff && <CallStaffModal onClose={() => setShowCallStaff(false)} />}
    </div>
  );
}
