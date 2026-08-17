import { useEffect, useState } from "react";
import { ChefHat, ArrowRight, KeyRound, Clock3, UtensilsCrossed, MapPin } from "lucide-react";
import { apiClient, type ApiStoreDirectoryEntry } from "../lib/apiClient";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";

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
      <header className="sticky top-0 z-10 bg-[#F5F1E6]/90 backdrop-blur-sm border-b border-black/[0.04]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1F3D2B] flex items-center justify-center shrink-0">
              <ChefHat size={18} className="text-white" />
            </div>
            <p className="text-[15px] font-bold text-[#22201B] tracking-tight">MenuPilot</p>
          </div>
          <div className="flex items-center gap-2.5">
            <LangSwitcher />
            <a
              href="/admin"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2D5A3D] bg-white border border-[#2D5A3D]/15 px-3.5 py-2 rounded-full shadow-sm hover:shadow transition-shadow active:scale-95"
            >
              <KeyRound size={13} />
              <span className="hidden sm:inline">{t("directory_admin_login")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-x-0 -top-24 h-72 opacity-[0.08] pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 100% at 20% 0%, #2D5A3D 0%, transparent 60%), radial-gradient(50% 100% at 85% 20%, #E0A83C 0%, transparent 55%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-3 py-1.5 rounded-full mb-4">
            <UtensilsCrossed size={12} />
            {t("directory_eyebrow")}
          </span>
          <h1 className="text-[30px] sm:text-[38px] font-bold text-[#22201B] tracking-tight leading-[1.1] mb-3">
            {t("directory_title")}
          </h1>
          <p className="text-[14.5px] sm:text-[15px] text-[#8A8272] max-w-md mx-auto leading-relaxed">
            {t("directory_subtitle")}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 sm:px-8 pb-16">
        <div className="max-w-5xl mx-auto w-full">
          {error && (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center text-[13px] text-[#B0553C] max-w-lg mx-auto">
              {t("directory_load_error")}
            </div>
          )}

          {!error && stores === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-black/5 bg-white">
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
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center text-[13px] text-[#B0A794] max-w-lg mx-auto">
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
                    href={`/?store=${store.slug}`}
                    className="group flex flex-col bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0 transition-all duration-200"
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
