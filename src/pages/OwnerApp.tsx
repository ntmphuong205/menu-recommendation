import { useState } from "react";
import { ChefHat, ClipboardList, UtensilsCrossed, ExternalLink } from "lucide-react";
import { RESTAURANT } from "../data/restaurant";
import { OrdersView } from "../owner/OrdersView";
import { MenuManagementView } from "../owner/MenuManagementView";

type Section = "orders" | "menu";

const NAV: { key: Section; label: string; icon: typeof ClipboardList }[] = [
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "menu", label: "Menu Management", icon: UtensilsCrossed },
];

export function OwnerApp() {
  const [section, setSection] = useState<Section>("orders");

  return (
    <div className="min-h-screen w-full flex bg-[#F5F1E6]">
      <aside className="w-60 shrink-0 bg-[#1F3D2B] text-white flex flex-col py-6 px-4 gap-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ChefHat size={18} />
          </div>
          <div>
            <p className="text-[14px] font-bold leading-tight">{RESTAURANT.name}</p>
            <p className="text-[11px] text-white/60">Owner Dashboard</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                section === key ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/60 hover:bg-white/5 transition-colors"
        >
          <ExternalLink size={14} />
          View customer app
        </a>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {section === "orders" && <OrdersView />}
        {section === "menu" && <MenuManagementView />}
      </main>
    </div>
  );
}
