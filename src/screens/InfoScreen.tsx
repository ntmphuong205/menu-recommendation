import { useState } from "react";
import { Clock, MapPin, Star, MessageCircle, Bell, Phone, Wifi } from "lucide-react";
import { RESTAURANT, getRestaurantText, getHoursLabel } from "../data/restaurant";
import { BEST_SELLERS } from "../data/menu";
import { DishCard } from "../components/DishCard";
import { CallStaffModal } from "../components/CallStaffModal";
import { LangSwitcher } from "../components/LangSwitcher";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

export function InfoScreen() {
  const { setActiveTab, menu, store, mode } = useApp();
  const { t, lang } = useI18n();
  const [showCallStaff, setShowCallStaff] = useState(false);
  const bestSellers = menu.filter((d) => BEST_SELLERS.includes(d.id));
  const restaurantText = getRestaurantText(lang);
  // Live store name/hours/description/address come from the backend once
  // loaded; rating/cuisine aren't modeled server-side yet, so those still
  // come from the static RESTAURANT object either way.
  const storeName = store ? store.name_i18n[lang] || store.name : RESTAURANT.name;
  const storeHours = store ? store.hours_i18n[lang] || store.hours : "";
  const storeDescription = store ? store.description_i18n[lang] || store.description : restaurantText.tagline;
  const storeAddress = store?.address || restaurantText.address;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          className="relative h-36 flex items-end px-4 pb-4 bg-gradient-to-br from-[#2D5A3D] to-[#1F3D2B] bg-cover bg-center"
          style={store?.cover_image ? { backgroundImage: `url(${store.cover_image})` } : undefined}
        >
          {store?.cover_image && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />}
          <div className="absolute top-4 right-4">
            <LangSwitcher dark />
          </div>
          <div className="relative">
            <h1 className="text-[20px] font-bold text-white">{storeName}</h1>
            <p className="text-[12px] text-white/80 line-clamp-1">{storeDescription}</p>
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
                {storeHours ? (
                  <p>{storeHours}</p>
                ) : (
                  RESTAURANT.hours.map((h) => {
                    const label = getHoursLabel(h, lang);
                    return (
                      <p key={h.day}>
                        <span className="font-medium text-[#22201B]">{label.day}: </span>
                        {label.time}
                      </p>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-[#5C5240]">{storeAddress}</p>
            </div>
          </div>

          {(store?.phone || store?.wifi_name) && (
            <div className="bg-white rounded-2xl p-3.5 border border-black/5 shadow-sm flex flex-col gap-2.5">
              {store.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {store.phone
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((p) => (
                        <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="text-[12.5px] font-medium text-[#22201B]">
                          {p}
                        </a>
                      ))}
                  </div>
                </div>
              )}
              {store.wifi_name && (
                <div className="flex items-start gap-2.5">
                  <Wifi size={16} className="text-[#2D5A3D] mt-0.5 shrink-0" />
                  <div className="text-[12.5px] text-[#5C5240]">
                    <p className="font-medium text-[#22201B]">{store.wifi_name}</p>
                    {store.wifi_password && <p className="font-mono text-[12px] mt-0.5">{store.wifi_password}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-2">{t("info_best_sellers")}</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {bestSellers.map((d) => (
                <DishCard key={d.id} dish={d} variant="chat" />
              ))}
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
            {mode === "store" && (
              <button
                onClick={() => setShowCallStaff(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 text-[#22201B] font-semibold text-[13px] py-3 rounded-full active:scale-[0.98] transition-transform"
              >
                <Bell size={15} />
                {t("info_call_staff")}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCallStaff && <CallStaffModal onClose={() => setShowCallStaff(false)} />}
    </div>
  );
}
