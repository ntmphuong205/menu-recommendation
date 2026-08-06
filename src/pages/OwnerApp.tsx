import { useEffect, useState } from "react";
import { ChefHat, ClipboardList, UtensilsCrossed, ExternalLink, BarChart3, QrCode, LogOut, Armchair, Star, Settings, Store as StoreIcon, KeyRound, Menu, X } from "lucide-react";
import { RESTAURANT } from "../data/restaurant";
import { OrdersView } from "../owner/OrdersView";
import { MenuManagementView } from "../owner/MenuManagementView";
import { AnalyticsView } from "../owner/AnalyticsView";
import { TableQrView } from "../owner/TableQrView";
import { SeatLayoutView } from "../owner/SeatLayoutView";
import { ReviewsView } from "../owner/ReviewsView";
import { StoreSettingsView } from "../owner/StoreSettingsView";
import { OwnerLogin } from "../owner/OwnerLogin";
import { StoreSwitcher } from "../owner/StoreSwitcher";
import { ChangePasswordModal } from "../owner/ChangePasswordModal";
import { useOwnerAuth } from "../store/useOwnerAuth";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";
import { getStoreSlug } from "../lib/storeSlug";
import type { TranslationKey } from "../i18n/translations";

type Section = "orders" | "menu" | "analytics" | "seating" | "tables" | "reviews" | "store";

const NAV: { key: Section; labelKey: TranslationKey; icon: typeof ClipboardList }[] = [
  { key: "orders", labelKey: "owner_nav_orders", icon: ClipboardList },
  { key: "menu", labelKey: "owner_nav_menu", icon: UtensilsCrossed },
  { key: "analytics", labelKey: "owner_nav_analytics", icon: BarChart3 },
  { key: "seating", labelKey: "owner_nav_seating", icon: Armchair },
  { key: "tables", labelKey: "owner_nav_tables", icon: QrCode },
  { key: "reviews", labelKey: "owner_nav_reviews", icon: Star },
  { key: "store", labelKey: "owner_nav_store", icon: Settings },
];

export function OwnerApp() {
  const [section, setSection] = useState<Section>("orders");
  const [navOpen, setNavOpen] = useState(false);
  const { t } = useI18n();
  const { authRequired, user, loading, signIn, signOut } = useOwnerAuth();
  // Resolved once we know which store this login belongs to (see
  // StoreSwitcher) — null means "not resolved yet", not "no store".
  const [storeSlug, setStoreSlug] = useState<string | null>(() => (authRequired ? null : getStoreSlug() || null));
  const [showChangePassword, setShowChangePassword] = useState(false);

  // A fresh sign-in should re-resolve which store to land on, in case the
  // previous session (or localStorage) pointed at a different one.
  useEffect(() => {
    if (!user) setStoreSlug(null);
  }, [user]);

  if (authRequired && loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6]" />;
  }

  if (authRequired && !user) {
    return <OwnerLogin signIn={signIn} />;
  }

  if (authRequired && !storeSlug) {
    return <StoreSwitcher onSelect={setStoreSlug} onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#F5F1E6]">
      {/* Mobile-only top bar: the sidebar below becomes a slide-in drawer
          under md, so small screens need some way to open it and see which
          section they're on. */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#1F3D2B] text-white flex items-center gap-3 px-4">
        <button onClick={() => setNavOpen(true)} className="shrink-0">
          <Menu size={20} />
        </button>
        <p className="text-[14px] font-bold truncate">{t(NAV.find((n) => n.key === section)?.labelKey ?? "owner_nav_orders")}</p>
      </div>

      {navOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setNavOpen(false)} />
      )}

      <aside
        className={`w-64 sm:w-60 shrink-0 bg-[#1F3D2B] text-white flex flex-col py-6 px-4 gap-6 fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-200 md:static md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
          <button onClick={() => setNavOpen(false)} className="md:hidden text-white/60">
            <X size={18} />
          </button>
        </div>
        <LangSwitcher dark />

        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setSection(key);
                setNavOpen(false);
              }}
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
              onClick={() => setStoreSlug(null)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/60 hover:bg-white/5 transition-colors text-left"
            >
              <StoreIcon size={14} />
              {t("owner_switch_store")}
            </button>
          )}
          {authRequired && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/60 hover:bg-white/5 transition-colors text-left"
            >
              <KeyRound size={14} />
              {t("owner_change_password")}
            </button>
          )}
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

      <main className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0">
        {section === "orders" && <OrdersView />}
        {section === "menu" && <MenuManagementView />}
        {section === "analytics" && <AnalyticsView />}
        {section === "seating" && <SeatLayoutView />}
        {section === "tables" && <TableQrView />}
        {section === "reviews" && <ReviewsView />}
        {section === "store" && <StoreSettingsView />}
      </main>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
