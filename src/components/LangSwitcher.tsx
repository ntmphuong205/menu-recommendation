import { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { LANGUAGES } from "../i18n/translations";

export function LangSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${
          dark ? "bg-white/10 text-white" : "bg-[#EFE9D8] text-[#5C5240]"
        }`}
      >
        <span>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-lg border border-black/5 overflow-hidden min-w-[130px]">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-left hover:bg-[#F5F1E6] ${
                  l.code === lang ? "font-semibold text-[#2D5A3D]" : "text-[#5C5240]"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
