import { Home } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

/** Re-shows the full-screen welcome greeting (WelcomeScreen) — the closest
 *  thing this app has to a "home page" — from any of the ordering screens.
 *  Sits next to LangSwitcher in each screen's header. */
export function HomeButton({ dark = false }: { dark?: boolean }) {
  const { returnHome } = useApp();
  const { t } = useI18n();

  return (
    <button
      onClick={returnHome}
      title={t("nav_back_home")}
      aria-label={t("nav_back_home")}
      className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 active:scale-90 transition-transform ${
        dark ? "bg-white/10 text-white" : "bg-[#EFE9D8] text-[#5C5240]"
      }`}
    >
      <Home size={14} />
    </button>
  );
}
