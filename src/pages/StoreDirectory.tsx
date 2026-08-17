import { useEffect, useState } from "react";
import { ChefHat, ArrowRight, KeyRound } from "lucide-react";
import { apiClient, type ApiStoreDirectoryEntry } from "../lib/apiClient";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";

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
      <div className="flex items-center justify-between px-5 sm:px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#1F3D2B] flex items-center justify-center">
            <ChefHat size={18} className="text-white" />
          </div>
          <p className="text-[15px] font-bold text-[#22201B]">MenuPilot</p>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <a
            href="/admin"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2D5A3D] bg-white border border-[#2D5A3D]/20 px-3.5 py-2 rounded-full active:scale-95 transition-transform"
          >
            <KeyRound size={13} />
            {t("directory_admin_login")}
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 sm:px-8 py-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#22201B] mb-1.5 text-center">
            {t("directory_title")}
          </h1>
          <p className="text-[13.5px] text-[#8A8272] text-center mb-8">{t("directory_subtitle")}</p>

          {error && (
            <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0553C]">
              {t("directory_load_error")}
            </div>
          )}

          {!error && stores === null && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!error && stores !== null && stores.length === 0 && (
            <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
              {t("directory_empty")}
            </div>
          )}

          {!error && stores !== null && stores.length > 0 && (
            <div className="flex flex-col gap-3">
              {stores.map((store) => (
                <a
                  key={store.id}
                  href={`/?store=${store.slug}`}
                  className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 active:scale-[0.99] transition-transform"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#22201B] truncate">
                      {store.name_i18n[lang] || store.name_i18n.en}
                    </p>
                    {(store.description_i18n[lang] || store.description_i18n.en) && (
                      <p className="text-[12.5px] text-[#8A8272] mt-0.5 line-clamp-1">
                        {store.description_i18n[lang] || store.description_i18n.en}
                      </p>
                    )}
                    {(store.hours_i18n[lang] || store.hours_i18n.en) && (
                      <p className="text-[11.5px] text-[#B0A794] mt-1">{store.hours_i18n[lang] || store.hours_i18n.en}</p>
                    )}
                  </div>
                  <ArrowRight size={18} className="text-[#2D5A3D] shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
