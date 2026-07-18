import { useState } from "react";
import { Plus, Pencil, Trash2, Ban, RotateCcw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { TagPill } from "../components/TagPill";
import { DishFormModal } from "./DishFormModal";
import { useI18n } from "../i18n/I18nContext";
import type { Dish } from "../data/menu";

export function MenuManagementView() {
  const { menu, addDish, updateDish, deleteDish } = useApp();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Dish | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === menu.length ? new Set() : new Set(menu.map((d) => d.id))));
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (window.confirm(`Remove ${selected.size} dish${selected.size > 1 ? "es" : ""} from the menu?`)) {
      selected.forEach((id) => deleteDish(id));
      setSelected(new Set());
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("owner_nav_menu")}</h1>
          <p className="text-[13px] text-[#8A8272]">
            Changes here appear instantly in the customer app — including Menu AI's recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 bg-[#B0553C] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full active:scale-95 transition-transform"
            >
              <Trash2 size={14} />
              {t("menu_delete_selected")} ({selected.size})
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-[#2D5A3D] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={15} />
            Add Dish
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F5F1E6] text-[#8A8272] text-left">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === menu.length && menu.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[#2D5A3D]"
                  />
                </th>
                <th className="px-2 py-3 font-medium">{t("menu_table_img")}</th>
                <th className="px-4 py-3 font-medium">{t("menu_table_name")}</th>
                <th className="px-4 py-3 font-medium">{t("menu_table_price")}</th>
                <th className="px-4 py-3 font-medium">{t("menu_table_desc")}</th>
                <th className="px-4 py-3 font-medium">{t("menu_table_tags")}</th>
                <th className="px-4 py-3 font-medium">{t("menu_table_status")}</th>
              </tr>
            </thead>
            <tbody>
              {menu.map((dish) => (
                <tr key={dish.id} className={`border-t border-black/5 ${dish.soldOut ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selected.has(dish.id)}
                      onChange={() => toggleSelected(dish.id)}
                      className="w-4 h-4 accent-[#2D5A3D] mt-1"
                    />
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EFE9D8] shrink-0">
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-[#22201B] whitespace-nowrap">{dish.name}</td>
                  <td className="px-4 py-3 align-top font-semibold text-[#2D5A3D] whitespace-nowrap">
                    ${dish.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 align-top text-[#5C5240] max-w-[220px]">{dish.description}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {dish.tags.map((tag) => (
                        <TagPill key={tag} tag={tag} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col items-start gap-1.5">
                      <button
                        onClick={() => setEditing(dish)}
                        className="flex items-center gap-1 text-[11.5px] font-medium text-[#5C5240] bg-[#F5F1E6] px-2.5 py-1 rounded-full whitespace-nowrap"
                      >
                        <Pencil size={11} />
                        {t("menu_edit")}
                      </button>
                      <button
                        onClick={() => updateDish(dish.id, { soldOut: !dish.soldOut })}
                        className={`flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          dish.soldOut ? "text-[#2D5A3D] bg-[#E5F3EA]" : "text-[#8A6B1F] bg-[#FDECC8]"
                        }`}
                      >
                        {dish.soldOut ? <RotateCcw size={11} /> : <Ban size={11} />}
                        {dish.soldOut ? t("menu_mark_available") : t("menu_set_sold_out")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <DishFormModal
          onClose={() => setShowAdd(false)}
          onSave={(dish) => {
            addDish(dish);
            setShowAdd(false);
          }}
        />
      )}

      {editing && (
        <DishFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(dish) => {
            updateDish(editing.id, dish);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
