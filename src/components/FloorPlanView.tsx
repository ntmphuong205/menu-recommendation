import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";
import type { ApiTable } from "../lib/apiClient";

const STATUS_BG: Record<ApiTable["status"], string> = {
  available: "bg-[#4CAF7D]",
  soon: "bg-[#E0A83C]",
  reserved: "bg-[#5B7FA6]",
  occupied: "bg-[#C97456]",
};

/** Terrace vs indoor is inferred the same way the backend's AI chat context
 *  does (api/index.py's chat()), so the visual map and AI answers agree. */
export function isTerrace(table: ApiTable): boolean {
  return table.view.includes("테라스") || table.view.toLowerCase().includes("terrace") || table.x >= 70;
}

// Recognizes the handful of feature values seed data / the seat editor
// actually produces (English going forward, Korean on any table seeded
// before this was localized) and translates them. Free-text the admin
// enters that doesn't match one of these is shown as-is — there's no way
// to translate arbitrary admin-authored text automatically.
const FEATURE_LABEL_KEYS: Record<string, TranslationKey> = {
  "창가": "table_feature_window",
  window: "table_feature_window",
  "실내": "table_feature_indoor",
  indoor: "table_feature_indoor",
  "테라스": "table_terrace",
  terrace: "table_terrace",
  "인기": "tag_popular",
  popular: "tag_popular",
};

export function localizeTableFeature(raw: string, t: (key: TranslationKey) => string): string {
  const key = FEATURE_LABEL_KEYS[raw.trim().toLowerCase()];
  return key ? t(key) : raw;
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className={`text-[17px] font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-[#8A8272] leading-tight">{label}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

/** Mini floor-plan seat picker — visual layout ported from Wexit's
 *  admin.html/app.html floor plan (kitchen/terrace zones, tables placed by
 *  x/y%, colored by live status), restyled to ICAPS's palette. */
export function FloorPlanView({ tables, onSelect }: { tables: ApiTable[]; onSelect: (table: ApiTable) => void }) {
  const { t } = useI18n();
  const counts = {
    available: tables.filter((tb) => tb.status === "available").length,
    soon: tables.filter((tb) => tb.status === "soon").length,
    reserved: tables.filter((tb) => tb.status === "reserved").length,
    occupied: tables.filter((tb) => tb.status === "occupied").length,
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-3 grid grid-cols-4 gap-1 text-center">
        <StatTile value={counts.available} label={t("table_status_available")} color="text-[#2D5A3D]" />
        <StatTile value={counts.soon} label={t("table_status_soon")} color="text-[#8A6B1F]" />
        <StatTile value={counts.reserved} label={t("table_status_reserved")} color="text-[#3E5C7A]" />
        <StatTile value={counts.occupied} label={t("table_status_occupied")} color="text-[#B0553C]" />
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[#8A8272] px-0.5 flex-wrap">
        <LegendDot color="bg-[#4CAF7D]" label={t("table_status_available")} />
        <LegendDot color="bg-[#E0A83C]" label={t("table_status_soon")} />
        <LegendDot color="bg-[#5B7FA6]" label={t("table_status_reserved")} />
        <LegendDot color="bg-[#C97456]" label={t("table_status_occupied")} />
      </div>

      <div className="relative bg-[#EFE4CE] rounded-2xl overflow-hidden aspect-[10/11] border border-black/5">
        <div className="absolute left-0 top-0 w-[28%] h-[20%] bg-black/[0.06] rounded-br-xl flex items-center justify-center text-[8.5px] font-semibold text-[#5C5240] text-center px-1">
          {t("table_kitchen")}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[26%] bg-[#2D5A3D]/[0.07] border-l-2 border-dashed border-[#2D5A3D]/25">
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#2D5A3D] bg-white/80 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {t("table_terrace")}
          </span>
        </div>

        {tables.map((table) => (
          <button
            key={table.db_id || table.id}
            onClick={() => onSelect(table)}
            style={{ left: `${table.x}%`, top: `${table.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-white text-[10.5px] font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform ${STATUS_BG[table.status]}`}
          >
            {table.id}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 bg-white rounded-2xl p-3 border border-black/5 shadow-sm">
        <div className="w-9 h-9 shrink-0 rounded-full bg-[#E5F3EA] flex items-center justify-center text-[15px]">
          🍽️
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-[#22201B] truncate">{t("table_select_prompt_title")}</p>
          <p className="text-[10.5px] text-[#8A8272] leading-tight">{t("table_select_prompt_desc")}</p>
        </div>
      </div>
    </div>
  );
}
