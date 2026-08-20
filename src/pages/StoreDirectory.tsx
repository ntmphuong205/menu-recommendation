import { useEffect, useState } from "react";
import { ChefHat, ArrowRight, KeyRound, Clock3, UtensilsCrossed, MapPin, Leaf, Sparkles, Smartphone, Store } from "lucide-react";
import { apiClient, type ApiStoreDirectoryEntry } from "../lib/apiClient";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";
import { clearAllWebOrderIntents } from "../context/AppContext";

/** Rotating gradient treatments for each restaurant's card header — there
 *  are no cover photos in the data model yet, so this stands in as visual
 *  variety instead of every card looking identical. Picked from colors
 *  already used elsewhere in the app (green/amber/terracotta/blue). */
const CARD_THEMES = [
  "from-[#1F3D2B] to-[#2D5A3D]",
  "from-[#8A6B1F] to-[#E0A83C]",
  "from-[#8A3D2A] to-[#B0553C]",
  "from-[#1E3A52] to-[#2A5C8A]",
];

function themeForStore(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_THEMES[hash % CARD_THEMES.length];
}

/** Shown at the bare domain root (no ?store= in the URL) — every QR code
 *  this product generates already bakes in a store slug (see
 *  TableQrView.tsx), so this only ever appears when someone lands here
 *  without one: typing the domain directly, a marketing link, etc. Picking
 *  a restaurant here just navigates to the same customer app with
 *  ?store=<slug> added, same as scanning that store's own QR would. */
export function StoreDirectory() {
  const { t, lang } = useI18n();
  const [stores, setStores] = useState<ApiStoreDirectoryEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    clearAllWebOrderIntents();
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getStores()
      .then((res) => {
        if (!cancelled) setStores(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F5F1E6] flex flex-col">
      {/* ---------------- Dark hero ---------------- */}
      <div className="relative overflow-hidden bg-[#12211A]">
        {/* Decorative glow blobs — CSS only, no image assets needed */}
        <div className="absolute -top-24 -left-16 w-80 h-80 bg-[#4CAF7D]/25 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-10 -right-20 w-96 h-96 bg-[#E0A83C]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-[#2D5A3D]/30 rounded-full blur-[90px] pointer-events-none" />

        {/* Floating leaf accents */}
        <Leaf size={26} className="absolute top-24 left-[8%] text-[#4CAF7D]/25 rotate-[-15deg] hidden sm:block" />
        <Leaf size={20} className="absolute top-16 right-[14%] text-[#4CAF7D]/20 rotate-[25deg] hidden sm:block" />
        <Sparkles size={18} className="absolute bottom-24 right-[10%] text-[#E0A83C]/25 hidden sm:block" />

        <header className="relative z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-5 sm:px-8 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ChefHat size={18} className="text-white" />
              </div>
              <p className="text-[15px] font-bold text-white tracking-tight">MenuPilot</p>
            </div>
            <div className="flex items-center gap-2.5">
              <LangSwitcher dark />
              <a
                href="/admin"
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-white/10 border border-white/15 px-3.5 py-2 rounded-full hover:bg-white/15 transition-colors active:scale-95"
              >
                <KeyRound size={13} />
                <span className="hidden sm:inline">{t("directory_admin_login")}</span>
              </a>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 pb-24 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#B7E4C7] bg-white/10 border border-white/10 px-3 py-1.5 rounded-full mb-5">
            <UtensilsCrossed size={12} />
            {t("directory_eyebrow")}
          </span>
          <h1 className="text-[34px] sm:text-[48px] font-bold text-white tracking-tight leading-[1.08] mb-4 text-balance">
            {t("directory_hero_line1")} <span className="text-[#E0A83C]">{t("directory_hero_highlight")}</span>
          </h1>
          <p className="text-[14.5px] sm:text-[16px] text-white/65 max-w-md mx-auto leading-relaxed mb-8">
            {t("directory_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#restaurants"
              className="flex items-center gap-2 bg-[#4CAF7D] text-[#0F1F16] font-bold text-[14px] px-7 py-3.5 rounded-full active:scale-95 transition-transform shadow-[0_8px_30px_-8px_rgba(76,175,125,0.6)]"
            >
              {t("directory_cta_view_menu")}
              <ArrowRight size={16} />
            </a>
            <button
              type="button"
              title={t("directory_app_soon_tooltip")}
              className="flex items-center gap-2 border border-white/20 text-white/50 font-semibold text-[14px] px-7 py-3.5 rounded-full cursor-not-allowed"
            >
              <Smartphone size={16} />
              {t("directory_cta_download_app")}
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">{t("directory_soon_badge")}</span>
            </button>
          </div>

          {stores && stores.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-10 text-white/70">
              <Store size={15} />
              <span className="text-[13px]">{t("directory_stat_stores", { count: stores.length })}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Restaurant grid ---------------- */}
      <div id="restaurants" className="flex-1 px-5 sm:px-8 -mt-10 sm:-mt-14 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto w-full">
          {error && (
            <div className="bg-white rounded-2xl p-12 border border-black/5 shadow-lg text-center text-[13px] text-[#B0553C] max-w-lg mx-auto">
              {t("directory_load_error")}
            </div>
          )}

          {!error && stores === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-black/5 bg-white shadow-lg">
                  <div className="h-24 bg-black/5 animate-pulse" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-4 w-2/3 bg-black/5 rounded animate-pulse" />
                    <div className="h-3 w-full bg-black/5 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!error && stores !== null && stores.length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-black/5 shadow-lg text-center text-[13px] text-[#B0A794] max-w-lg mx-auto">
              {t("directory_empty")}
            </div>
          )}

          {!error && stores !== null && stores.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stores.map((store) => {
                const name = store.name_i18n[lang] || store.name_i18n.en;
                const description = store.description_i18n[lang] || store.description_i18n.en;
                const hours = store.hours_i18n[lang] || store.hours_i18n.en;
                return (
                  <a
                    key={store.id}
                    href={`/?store=${store.slug}&mode=web`}
                    className="group flex flex-col bg-white rounded-2xl border border-black/5 shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0 transition-all duration-200"
                  >
                    <div className={`relative h-24 bg-gradient-to-br ${themeForStore(store.id)} flex items-center px-5 overflow-hidden shrink-0`}>
                      <span className="absolute -right-3 -bottom-5 text-[88px] font-black text-white/10 leading-none select-none">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div className="relative w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-4 sm:p-5 flex-1">
                      <p className="text-[15.5px] font-bold text-[#22201B] leading-snug">{name}</p>
                      {description && (
                        <p className="text-[12.5px] text-[#8A8272] leading-relaxed line-clamp-2">{description}</p>
                      )}
                      <div className="flex flex-col gap-1 mt-auto pt-2">
                        {hours && (
                          <span className="flex items-center gap-1.5 text-[11px] text-[#B0A794]">
                            <Clock3 size={11} />
                            {hours}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[12.5px] font-semibold text-[#2D5A3D] mt-1.5">
                          {t("directory_view_menu")}
                          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-black/[0.04] py-6">
        <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-[#B0A794]">
          <MapPin size={11} />
          {t("directory_footer")}
        </p>
      </footer>
    </div>
  );
}
