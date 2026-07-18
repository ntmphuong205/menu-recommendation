import { useState, type ReactNode } from "react";
import { X, Upload } from "lucide-react";
import { TAGS, type Dish, type TagKey } from "../data/menu";

const CATEGORIES: Dish["category"][] = ["Main", "Starter", "Beverage", "Side"];
const ALL_TAGS = Object.keys(TAGS) as TagKey[];

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DishFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Dish;
  onClose: () => void;
  onSave: (dish: Dish) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [category, setCategory] = useState<Dish["category"]>(initial?.category ?? "Main");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [calories, setCalories] = useState(initial?.calories?.toString() ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients?.join(", ") ?? "");
  const [allergyNote, setAllergyNote] = useState(initial?.allergyNote ?? "");
  const [tags, setTags] = useState<Set<TagKey>>(new Set(initial?.tags ?? []));

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: TagKey) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const canSave = name.trim().length > 0 && price.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const dish: Dish = {
      id: initial?.id ?? (slugify(name) || `dish-${Date.now()}`),
      name: name.trim(),
      price: parseFloat(price) || 0,
      description: description.trim(),
      image: image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
      tags: Array.from(tags),
      calories: calories.trim() ? parseInt(calories, 10) : undefined,
      detail: detail.trim() || undefined,
      ingredients: ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      allergyNote: allergyNote.trim(),
      category,
    };
    onSave(dish);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="text-[16px] font-bold text-[#22201B]">{initial ? "Edit Dish" : "Add Dish"}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3.5">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Handmade Hamburger" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price ($)">
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className={inputCls} placeholder="8.00" />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as Dish["category"])} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} h-16 resize-none`} placeholder="Short, appetizing description" />
          </Field>

          <Field label="Menu photo">
            <div className="flex items-center gap-3">
              {image && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EFE9D8] shrink-0 border border-black/10">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <label className={`${inputCls} flex items-center gap-2 cursor-pointer text-[#5C5240]`}>
                <Upload size={14} />
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </Field>

          <Field label="Or image URL">
            <input value={image} onChange={(e) => setImage(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories (optional)">
              <input value={calories} onChange={(e) => setCalories(e.target.value)} type="number" className={inputCls} placeholder="520" />
            </Field>
            <Field label="Extra detail (optional)">
              <input value={detail} onChange={(e) => setDetail(e.target.value)} className={inputCls} placeholder="Protein: 25g" />
            </Field>
          </div>

          <Field label="Ingredients (comma-separated)">
            <input value={ingredients} onChange={(e) => setIngredients(e.target.value)} className={inputCls} placeholder="Beef patty, cheese, lettuce..." />
          </Field>

          <Field label="Allergy note">
            <input value={allergyNote} onChange={(e) => setAllergyNote(e.target.value)} className={inputCls} placeholder="Contains gluten, dairy." />
          </Field>

          <div>
            <p className="text-[12px] font-semibold text-[#5C5240] mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-colors ${
                    tags.has(tag) ? "bg-[#2D5A3D] text-white" : "bg-[#EFE9D8] text-[#5C5240]"
                  }`}
                >
                  {TAGS[tag].emoji} {TAGS[tag].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-black/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-black/10 text-[13px] font-semibold text-[#5C5240]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold disabled:opacity-40"
          >
            Save Dish
          </button>
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
