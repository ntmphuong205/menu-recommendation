import { useState, type ReactNode } from "react";
import { X, Upload, Plus, Trash2 } from "lucide-react";
import { TAGS, type Dish, type TagKey } from "../data/menu";
import { INGREDIENT_DB, computeNutrition, type IngredientKey, type IngredientLine } from "../data/ingredients";

const CATEGORIES: Dish["category"][] = ["Main", "Starter", "Beverage", "Side"];
const ALL_TAGS = Object.keys(TAGS) as TagKey[];
const ALL_INGREDIENTS = Object.keys(INGREDIENT_DB) as IngredientKey[];

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let lineIdCounter = 0;

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
  const [prepTime, setPrepTime] = useState(initial?.prepTimeMinutes?.toString() ?? "");
  const [lines, setLines] = useState<{ id: number; ingredient: IngredientKey; grams: string }[]>(
    initial?.ingredientLines?.map((l) => ({ id: lineIdCounter++, ingredient: l.ingredient, grams: String(l.grams) })) ?? []
  );
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

  const addLine = () => setLines((prev) => [...prev, { id: lineIdCounter++, ingredient: ALL_INGREDIENTS[0], grams: "100" }]);
  const removeLine = (id: number) => setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (id: number, patch: Partial<{ ingredient: IngredientKey; grams: string }>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const ingredientLines: IngredientLine[] = lines
    .filter((l) => parseFloat(l.grams) > 0)
    .map((l) => ({ ingredient: l.ingredient, grams: parseFloat(l.grams) }));
  const nutrition = computeNutrition(ingredientLines);

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
      ingredientLines: ingredientLines.length > 0 ? ingredientLines : undefined,
      calories: ingredientLines.length > 0 ? Math.round(nutrition.calories) : undefined,
      protein: ingredientLines.length > 0 ? Math.round(nutrition.protein) : undefined,
      carbs: ingredientLines.length > 0 ? Math.round(nutrition.carbs) : undefined,
      fat: ingredientLines.length > 0 ? Math.round(nutrition.fat) : undefined,
      ingredients: ingredientLines.map((l) => INGREDIENT_DB[l.ingredient].label),
      allergyNote: allergyNote.trim(),
      category,
      prepTimeMinutes: prepTime.trim() ? parseInt(prepTime, 10) : undefined,
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

          <Field label="Prep time (minutes, optional)">
            <input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} type="number" className={inputCls} placeholder="12" />
          </Field>

          <div>
            <p className="text-[12px] font-semibold text-[#5C5240] mb-1">Ingredients</p>
            <p className="text-[11px] text-[#8A8272] mb-2">
              Add each ingredient and how many grams go into one serving — calories, protein, carbs, and fat are worked
              out for you.
            </p>
            <div className="flex flex-col gap-2">
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-2">
                  <select
                    value={line.ingredient}
                    onChange={(e) => updateLine(line.id, { ingredient: e.target.value as IngredientKey })}
                    className={`${inputCls} flex-1`}
                  >
                    {ALL_INGREDIENTS.map((key) => (
                      <option key={key} value={key}>
                        {INGREDIENT_DB[key].label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={line.grams}
                    onChange={(e) => updateLine(line.id, { grams: e.target.value })}
                    type="number"
                    className={`${inputCls} w-20`}
                    placeholder="g"
                  />
                  <span className="text-[11px] text-[#8A8272] shrink-0">g</span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="w-7 h-7 rounded-full bg-[#F7E9E2] text-[#B0553C] flex items-center justify-center shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-3 py-1.5 rounded-full self-start"
              >
                <Plus size={13} />
                Add ingredient
              </button>
            </div>

            {ingredientLines.length > 0 && (
              <div className="mt-3 bg-[#F3E9D2] rounded-xl px-3 py-2.5 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.calories)}</p>
                  <p className="text-[10px] text-[#8A6B3F]">kcal</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.protein)}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">Protein</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.carbs)}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">Carbs</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.fat)}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">Fat</p>
                </div>
              </div>
            )}
          </div>

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
                  {TAGS[tag].label}
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
