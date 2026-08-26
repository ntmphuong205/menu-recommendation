import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { useTablesData } from "../store/useTablesData";
import type { ApiTable } from "../lib/apiClient";
import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";

const STATUS_OPTIONS: ApiTable["status"][] = ["available", "reserved", "occupied"];

const STATUS_LABEL_KEY: Record<ApiTable["status"], TranslationKey> = {
  available: "table_status_available",
  reserved: "table_status_reserved",
  occupied: "table_status_occupied",
};

// Solid fills, not faint rings on a white tile — a thin 2px outline at 40%
// opacity read as barely-there on the actual floor plan, especially for
// "reserved" (a near-invisible ring-black/15). Same traffic-light palette
// as the customer-facing FloorPlanView so the two stay visually consistent.
const STATUS_STYLE: Record<ApiTable["status"], string> = {
  available: "bg-[#4CAF7D] text-white border-transparent",
  reserved: "bg-[#5B7FA6] text-white border-transparent",
  occupied: "bg-[#B0553C] text-white border-transparent",
};

function nextTableCode(tables: ApiTable[]): string {
  const codes = new Set(tables.map((t) => t.id));
  let n = tables.length + 1;
  while (codes.has(`T${n}`)) n += 1;
  return `T${n}`;
}

/** Admin floor-plan editor: drag tables to match the real room, edit their
 *  status/view/tag/capacity, then Save writes the whole layout in one call
 *  (PUT /api/tables) — ported from Wexit's admin.html pointer-drag editor. */
export function SeatLayoutView() {
  const { t } = useI18n();
  const { tables, saveLayout } = useTablesData();
  const [draft, setDraft] = useState<ApiTable[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Local draft becomes authoritative as soon as the admin makes any edit;
  // until then it mirrors the live polled data.
  const layout = draft ?? tables;
  const setLayout = (next: ApiTable[]) => setDraft(next);

  const updateSelected = (patch: Partial<ApiTable>) => {
    setLayout(layout.map((t, i) => (i === selectedIndex ? { ...t, ...patch } : t)));
  };

  const addTable = () => {
    const next: ApiTable = {
      id: nextTableCode(layout),
      db_id: "",
      x: 50,
      y: 50,
      status: "available",
      view: "",
      tag: "",
      capacity: 4,
      table_image: "",
      view_image: "",
      session_started_at: null,
    };
    setLayout([...layout, next]);
    setSelectedIndex(layout.length);
  };

  const deleteSelected = () => {
    if (!layout[selectedIndex]) return;
    setLayout(layout.filter((_, i) => i !== selectedIndex));
    setSelectedIndex((i) => Math.max(0, i - 1));
  };

  const handlePointerDown = (index: number) => (e: PointerEvent<HTMLButtonElement>) => {
    setSelectedIndex(index);
    setDragIndex(index);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragIndex < 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
    const y = Math.min(94, Math.max(6, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));
    setLayout(layout.map((t, i) => (i === dragIndex ? { ...t, x, y } : t)));
  };

  const handlePointerUp = () => setDragIndex(-1);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveLayout(layout);
      setDraft(saved);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("seating_save_error"));
    } finally {
      setSaving(false);
    }
  };

  const selected = layout[selectedIndex];

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("seating_title")}</h1>
          <p className="text-[13px] text-[#8A8272]">{t("seating_subtitle")}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={addTable}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-3.5 py-2 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={14} />
            {t("seating_add_table")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-[#2D5A3D] px-3.5 py-2 rounded-full disabled:opacity-50 active:scale-95 transition-transform"
          >
            <Save size={14} />
            {saving ? t("seating_saving") : t("seating_save")}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-[#8A8272] mb-3 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLE[s].split(" ")[0]}`} />
            {t(STATUS_LABEL_KEY[s])}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative bg-[#F5F1E6] border border-black/5 rounded-2xl aspect-[16/10] overflow-hidden touch-none select-none"
        >
          {layout.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-[13px] text-[#B0A794]">
              {t("seating_empty")}
            </p>
          )}
          {layout.map((table, i) => (
            <button
              key={table.db_id || table.id || i}
              onPointerDown={handlePointerDown(i)}
              style={{ left: `${table.x}%`, top: `${table.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl border flex items-center justify-center text-[11px] font-bold cursor-grab active:cursor-grabbing transition-shadow ${
                i === selectedIndex ? "ring-2 ring-offset-2 ring-[#22201B] shadow-md" : "opacity-90"
              } ${STATUS_STYLE[table.status]}`}
            >
              {table.id}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4">
          {selected ? (
            <div className="flex flex-col gap-3">
              <Field label={t("seating_field_code")}>
                <input
                  value={selected.id}
                  onChange={(e) => updateSelected({ id: e.target.value.trim().toUpperCase() })}
                  className={inputCls}
                />
              </Field>
              <Field label={t("seating_field_status")}>
                <select
                  value={selected.status}
                  onChange={(e) => updateSelected({ status: e.target.value as ApiTable["status"] })}
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(STATUS_LABEL_KEY[s])}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("seating_field_view")}>
                <input
                  value={selected.view}
                  onChange={(e) => updateSelected({ view: e.target.value })}
                  className={inputCls}
                  placeholder={t("seating_field_view_placeholder")}
                />
              </Field>
              <Field label={t("seating_field_tag")}>
                <input
                  value={selected.tag}
                  onChange={(e) => updateSelected({ tag: e.target.value })}
                  className={inputCls}
                  placeholder={t("seating_field_tag_placeholder")}
                />
              </Field>
              <Field label={t("seating_field_capacity")}>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={selected.capacity}
                  onChange={(e) => updateSelected({ capacity: parseInt(e.target.value, 10) || 1 })}
                  className={inputCls}
                />
              </Field>
              <button
                onClick={deleteSelected}
                className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#B0553C] bg-[#F7E9E2] py-2 rounded-full mt-1 active:scale-95 transition-transform"
              >
                <Trash2 size={13} />
                {t("seating_delete_table")}
              </button>
            </div>
          ) : (
            <p className="text-[12.5px] text-[#B0A794] text-center py-6">{t("seating_select_prompt")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] text-[#22201B] outline-none focus:border-[#2D5A3D]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{label}</p>
      {children}
    </label>
  );
}
