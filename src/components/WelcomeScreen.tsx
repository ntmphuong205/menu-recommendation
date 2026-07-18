import { ChefHat, ArrowRight } from "lucide-react";
import { RESTAURANT } from "../data/restaurant";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "./LangSwitcher";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 px-8 text-center bg-gradient-to-b from-[#2D5A3D] to-[#1F3D2B] animate-welcome-in">
      <div className="absolute top-5 right-5">
        <LangSwitcher dark />
      </div>
      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-1">
        <ChefHat size={30} className="text-white" />
      </div>
      <h1 className="text-[22px] font-bold text-white leading-snug text-balance">
        {t("welcome_greeting", { restaurant: RESTAURANT.name })}
      </h1>
      <p className="text-[14px] text-white/75 leading-relaxed max-w-[26ch]">{t("welcome_sub")}</p>
      <button
        onClick={onStart}
        className="mt-3 flex items-center gap-2 bg-white text-[#1F3D2B] font-semibold text-[14px] px-6 py-3 rounded-full active:scale-95 transition-transform"
      >
        {t("welcome_cta")}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
