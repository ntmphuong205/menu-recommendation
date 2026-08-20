import { Home } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";

/** Leaves this restaurant's app entirely and goes to the site root, which
 *  (with no ?store= param) renders StoreDirectory — the multi-restaurant
 *  homepage. A full page navigation, not client-side routing: getStoreSlug()
 *  reads the URL once at module load, so an in-SPA route change to "/"
 *  wouldn't actually clear the resolved store. */
export function HomeButton({ dark = false }: { dark?: boolean }) {
  const { t } = useI18n();

  return (
    <a
      href="/"
      title={t("nav_back_home")}
      aria-label={t("nav_back_home")}
      className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 active:scale-90 transition-transform ${
        dark ? "bg-white/10 text-white" : "bg-[#EFE9D8] text-[#5C5240]"
      }`}
    >
      <Home size={14} />
    </a>
  );
}
