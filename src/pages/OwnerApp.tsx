import { useState } from "react";
import { ChefHat, ClipboardList, UtensilsCrossed, ExternalLink, BarChart3, QrCode, LogOut } from "lucide-react";
import { RESTAURANT } from "../data/restaurant";
import { OrdersView } from "../owner/OrdersView";
import { MenuManagementView } from "../owner/MenuManagementView";
import { AnalyticsView } from "../owner/AnalyticsView";
import { TableQrView } from "../owner/TableQrView";
import { OwnerLogin } from "../owner/OwnerLogin";
import { useOwnerAuth } from "../store/useOwnerAuth";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";
import type { TranslationKey } from "../i18n/translations";

type Section = "orders" | "menu" | "analytics" | "tables";

const NAV: { key: Section; labelKey: TranslationKey; icon: typeof ClipboardList }[] = [
  { key: "orders", labelKey: "owner_nav_orders", icon: ClipboardList },
  { key: "menu", labelKey: "owner_nav_menu", icon: UtensilsCrossed },
  { key: "analytics", labelKey: "owner_nav_analytics", icon: BarChart3 },
  { key: "tables", labelKey: "owner_nav_tables", icon: QrCode },
];

export function OwnerApp() {
  const [section, setSection] = useState<Section>("orders");
  const { t } = useI18n();
  const { authRequired, user, loading, signIn, signOut } = useOwnerAuth();

  if (authRequired && loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6]" />;
  }

  if (authRequired && !user) {
    return <OwnerLogin signIn={signIn} />;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#F5F1E6]">
      <aside className="w-60 shrink-0 bg-[#1F3D2B] text-white flex flex-col py-6 px-4 gap-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <ChefHat size={18} />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight">{RESTAURANT.name}</p>
              <p className="text-[11px] text-white/60">{t("owner_dashboard")}</p>
            </div>
          </div>
        </div>
        <LangSwitcher dark />

        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                section === key ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {t(labelKey)}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/60 hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={14} />
            {t("owner_view_customer")}
          </a>
          {authRequired && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/60 hover:bg-white/5 transition-colors text-left"
            >
              <LogOut size={14} />
              {t("owner_logout")}
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {section === "orders" && <OrdersView />}
        {section === "menu" && <MenuManagementView />}
        {section === "analytics" && <AnalyticsView />}
        {section === "tables" && <TableQrView />}
      </main>
    </div>
  );
}
