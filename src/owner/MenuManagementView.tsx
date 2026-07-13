import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { TagPill } from "../components/TagPill";
import { DishFormModal } from "./DishFormModal";
import type { Dish } from "../data/menu";

export function MenuManagementView() {
  const { menu, addDish, updateDish, deleteDish } = useApp();
  const [editing, setEditing] = useState<Dish | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleDelete = (dish: Dish) => {
    if (window.confirm(`Remove "${dish.name}" from the menu?`)) {
      deleteDish(dish.id);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">Menu Management</h1>
          <p className="text-[13px] text-[#8A8272]">
            Changes here appear instantly in the customer app — including Menu AI's recommendations.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#2D5A3D] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full active:scale-95 transition-transform shrink-0"
        >
          <Plus size={15} />
          Add Dish
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {menu.map((dish) => (
          <div key={dish.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-3 flex gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#EFE9D8]">
              <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-[#22201B] leading-tight">{dish.name}</p>
                  <p className="text-[12px] text-[#8A8272]">{dish.category}</p>
                </div>
                <span className="text-[14px] font-bold text-[#2D5A3D] shrink-0">${dish.price.toFixed(2)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {dish.tags.map((t) => (
                  <TagPill key={t} tag={t} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setEditing(dish)}
                  className="flex items-center gap-1 text-[11.5px] font-medium text-[#5C5240] bg-[#F5F1E6] px-2.5 py-1 rounded-full"
                >
                  <Pencil size={11} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dish)}
                  className="flex items-center gap-1 text-[11.5px] font-medium text-[#B0553C] bg-[#F7E9E2] px-2.5 py-1 rounded-full"
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
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
