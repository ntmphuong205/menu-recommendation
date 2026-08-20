import { useState, type ReactNode } from "react";
import { X, Upload, Plus, Trash2 } from "lucide-react";
import { TAGS, getDishName, getDishDescription, getDishAllergyNote, type Dish, type SizeVariant, type TagKey } from "../data/menu";
import { INGREDIENT_NAMES, findIngredientByName, computeNutrition, type IngredientLine } from "../data/ingredients";
import { useI18n } from "../i18n/I18nContext";
import { LANGUAGES } from "../i18n/translations";

const LEGACY_CATEGORIES = ["Main", "Starter", "Beverage", "Side"];
const ALL_TAGS = Object.keys(TAGS) as TagKey[];
const INGREDIENT_DATALIST_ID = "known-ingredients";
const CATEGORY_DATALIST_ID = "known-categories";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface LineState {
  id: number;
  name: string;
  grams: string;
  customCalories: string;
  customProtein: string;
  customCarbs: string;
  customFat: string;
}

let lineIdCounter = 0;

interface VariantRowState {
  id: number;
  label: string;
  price: string;
  calories: string;
}

let variantIdCounter = 0;

function toVariantRowState(v: SizeVariant): VariantRowState {
  return {
    id: variantIdCounter++,
    label: v.label,
    price: v.price.toString(),
    calories: v.calories !== undefined ? String(v.calories) : "",
  };
}

function toSizeVariant(row: VariantRowState): SizeVariant | null {
  const label = row.label.trim();
  const price = parseFloat(row.price);
  if (!label || !(price >= 0)) return null;
  const calories = row.calories.trim() ? parseInt(row.calories, 10) : undefined;
  return { id: slugify(label) || `v${row.id}`, label, price, calories };
}

// Flavor options never carry their own price (see Dish.flavorVariants) —
// they always mirror whatever the dish's own price resolves to.
function toFlavorVariant(row: VariantRowState, dishPrice: number): SizeVariant | null {
  const label = row.label.trim();
  if (!label) return null;
  const calories = row.calories.trim() ? parseInt(row.calories, 10) : undefined;
  return { id: slugify(label) || `v${row.id}`, label, price: dishPrice, calories };
}

function toLineState(line: IngredientLine): LineState {
  return {
    id: lineIdCounter++,
    name: line.name,
    grams: String(line.grams),
    customCalories: line.custom ? String(line.custom.calories) : "",
    customProtein: line.custom ? String(line.custom.protein) : "",
    customCarbs: line.custom ? String(line.custom.carbs) : "",
    customFat: line.custom ? String(line.custom.fat) : "",
  };
}

function toIngredientLine(line: LineState): IngredientLine | null {
  const grams = parseFloat(line.grams);
  if (!line.name.trim() || !(grams > 0)) return null;
  const known = findIngredientByName(line.name);
  if (known) return { name: line.name.trim(), grams };
  const hasCustom = [line.customCalories, line.customProtein, line.customCarbs, line.customFat].some((v) => v.trim());
  if (!hasCustom) return { name: line.name.trim(), grams };
  return {
    name: line.name.trim(),
    grams,
    custom: {
      calories: parseFloat(line.customCalories) || 0,
      protein: parseFloat(line.customProtein) || 0,
      carbs: parseFloat(line.customCarbs) || 0,
      fat: parseFloat(line.customFat) || 0,
    },
  };
}

export function DishFormModal({
  initial,
  menuCategories = [],
  onClose,
  onSave,
}: {
  initial?: Dish;
  /** This store's own category list (Store Settings) — suggested via a
   *  datalist alongside the legacy defaults, but any text can be typed. */
  menuCategories?: string[];
  onClose: () => void;
  onSave: (dish: Dish) => void;
}) {
  const { t, lang } = useI18n();
  const currentLangLabel = LANGUAGES.find((l) => l.code === lang)?.label ?? lang;
  // Name/description/allergy note are stored per-language (Dish.names etc.)
  // — edit and save in whichever language the admin dashboard is currently
  // showing, not always the English fallback, and merge back onto the
  // other two languages' existing text on save instead of overwriting it.
  const [name, setName] = useState(initial ? getDishName(initial, lang) : "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Main");
  const categoryOptions = Array.from(new Set([...menuCategories, ...LEGACY_CATEGORIES]));
  const [description, setDescription] = useState(initial ? getDishDescription(initial, lang) : "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [prepTime, setPrepTime] = useState(initial?.prepTimeMinutes?.toString() ?? "");
  const [lines, setLines] = useState<LineState[]>(initial?.ingredientLines?.map(toLineState) ?? []);
  const [allergyNote, setAllergyNote] = useState(initial ? getDishAllergyNote(initial, lang) : "");
  const [tags, setTags] = useState<Set<TagKey>>(new Set(initial?.tags ?? []));
  const [variantRows, setVariantRows] = useState<VariantRowState[]>(initial?.sizeVariants?.map(toVariantRowState) ?? []);
  const [flavorRows, setFlavorRows] = useState<VariantRowState[]>(initial?.flavorVariants?.map(toVariantRowState) ?? []);
  const [toppingRows, setToppingRows] = useState<VariantRowState[]>(initial?.toppings?.map(toVariantRowState) ?? []);

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

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { id: lineIdCounter++, name: "", grams: "100", customCalories: "", customProtein: "", customCarbs: "", customFat: "" },
    ]);
  const removeLine = (id: number) => setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (id: number, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const ingredientLines: IngredientLine[] = lines
    .map(toIngredientLine)
    .filter((l): l is IngredientLine => l !== null);
  const nutrition = computeNutrition(ingredientLines);

  const addVariantRow = () =>
    setVariantRows((prev) => [...prev, { id: variantIdCounter++, label: "", price: "", calories: "" }]);
  const removeVariantRow = (id: number) => setVariantRows((prev) => prev.filter((r) => r.id !== id));
  const updateVariantRow = (id: number, patch: Partial<VariantRowState>) =>
    setVariantRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addFlavorRow = () =>
    setFlavorRows((prev) => [...prev, { id: variantIdCounter++, label: "", price: "", calories: "" }]);
  const removeFlavorRow = (id: number) => setFlavorRows((prev) => prev.filter((r) => r.id !== id));
  const updateFlavorRow = (id: number, patch: Partial<VariantRowState>) =>
    setFlavorRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addToppingRow = () =>
    setToppingRows((prev) => [...prev, { id: variantIdCounter++, label: "", price: "", calories: "" }]);
  const removeToppingRow = (id: number) => setToppingRows((prev) => prev.filter((r) => r.id !== id));
  const updateToppingRow = (id: number, patch: Partial<VariantRowState>) =>
    setToppingRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const sizeVariants: SizeVariant[] = variantRows
    .map(toSizeVariant)
    .filter((v): v is SizeVariant => v !== null);
  const dishPrice = sizeVariants.length > 0 ? sizeVariants[0].price : parseFloat(price) || 0;
  const flavorVariants: SizeVariant[] = flavorRows
    .map((row) => toFlavorVariant(row, dishPrice))
    .filter((v): v is SizeVariant => v !== null);
  const toppings: SizeVariant[] = toppingRows
    .map(toSizeVariant)
    .filter((v): v is SizeVariant => v !== null);

  const canSave = name.trim().length > 0 && (sizeVariants.length > 0 || price.trim().length > 0);

  const handleSave = () => {
    if (!canSave) return;
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedAllergyNote = allergyNote.trim();
    // Merge the edited language onto whatever the other two already had —
    // never let editing the Vietnamese view blank out the English/Korean
    // text (or vice versa). The flat name/description/allergyNote fields
    // are the English fallback by convention; only actually replace them
    // when English is the language being edited (or there's no prior
    // English value yet, i.e. a brand-new dish).
    const names = { ...initial?.names, [lang]: trimmedName };
    const descriptions = { ...initial?.descriptions, [lang]: trimmedDescription };
    const allergyNotes = { ...initial?.allergyNotes, [lang]: trimmedAllergyNote };
    const dish: Dish = {
      id: initial?.id ?? (slugify(name) || `dish-${Date.now()}`),
      name: lang === "en" || !initial?.name ? trimmedName : initial.name,
      names,
      price: sizeVariants.length > 0 ? sizeVariants[0].price : parseFloat(price) || 0,
      currency: initial?.currency ?? "USD",
      description: lang === "en" || !initial?.description ? trimmedDescription : initial.description,
      descriptions,
      image: image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
      tags: Array.from(tags),
      ingredientLines: ingredientLines.length > 0 ? ingredientLines : undefined,
      calories:
        ingredientLines.length > 0
          ? Math.round(nutrition.calories)
          : sizeVariants.length > 0
            ? sizeVariants[0].calories
            : undefined,
      protein: ingredientLines.length > 0 ? Math.round(nutrition.protein) : undefined,
      carbs: ingredientLines.length > 0 ? Math.round(nutrition.carbs) : undefined,
      fat: ingredientLines.length > 0 ? Math.round(nutrition.fat) : undefined,
      ingredients: ingredientLines.map((l) => l.name),
      allergyNote: lang === "en" || !initial?.allergyNote ? trimmedAllergyNote : initial.allergyNote,
      allergyNotes,
      category,
      prepTimeMinutes: prepTime.trim() ? parseInt(prepTime, 10) : undefined,
      pairings: initial?.pairings,
      sizeVariants: sizeVariants.length > 0 ? sizeVariants : undefined,
      flavorVariants: flavorVariants.length > 0 ? flavorVariants : undefined,
      toppings: toppings.length > 0 ? toppings : undefined,
    };
    onSave(dish);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="text-[16px] font-bold text-[#22201B]">{initial ? t("dishform_edit_title") : t("dishform_add_title")}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3.5">
          <Field label={`${t("dishform_name")} (${currentLangLabel})`}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t("dishform_name_placeholder")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("dishform_price")}>
              <input
                value={sizeVariants.length > 0 ? sizeVariants[0].price.toString() : price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                step="0.01"
                className={inputCls}
                placeholder="8.00"
                disabled={variantRows.length > 0}
              />
              {variantRows.length > 0 && <p className="text-[10.5px] text-[#8A8272] mt-1">{t("dishform_price_from_variants")}</p>}
            </Field>
            <Field label={t("dishform_category")}>
              <input
                list={CATEGORY_DATALIST_ID}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
                placeholder={categoryOptions[0]}
              />
              <datalist id={CATEGORY_DATALIST_ID}>
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          <VariantGroupEditor
            rows={variantRows}
            onAdd={addVariantRow}
            onRemove={removeVariantRow}
            onUpdate={updateVariantRow}
            title={t("dishform_sizes_title")}
            desc={t("dishform_sizes_desc")}
            addLabel={t("dishform_add_size")}
            labelPlaceholder={t("dishform_size_label_placeholder")}
          />

          <VariantGroupEditor
            rows={flavorRows}
            onAdd={addFlavorRow}
            onRemove={removeFlavorRow}
            onUpdate={updateFlavorRow}
            title={t("dishform_flavors_title")}
            desc={t("dishform_flavors_desc")}
            addLabel={t("dishform_add_flavor")}
            labelPlaceholder={t("dishform_flavor_label_placeholder")}
            showPrice={false}
          />

          <VariantGroupEditor
            rows={toppingRows}
            onAdd={addToppingRow}
            onRemove={removeToppingRow}
            onUpdate={updateToppingRow}
            title={t("dishform_toppings_title")}
            desc={t("dishform_toppings_desc")}
            addLabel={t("dishform_add_topping")}
            labelPlaceholder={t("dishform_topping_label_placeholder")}
          />

          <Field label={`${t("dishform_description")} (${currentLangLabel})`}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} h-16 resize-none`} placeholder={t("dishform_description_placeholder")} />
          </Field>

          <Field label={t("dishform_photo")}>
            <div className="flex items-center gap-3">
              {image && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EFE9D8] shrink-0 border border-black/10">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <label className={`${inputCls} flex items-center gap-2 cursor-pointer text-[#5C5240]`}>
                <Upload size={14} />
                {t("dishform_choose_file")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </Field>

          <Field label={t("dishform_image_url")}>
            <input value={image} onChange={(e) => setImage(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>

          <Field label={t("dishform_prep_time")}>
            <input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} type="number" className={inputCls} placeholder="12" />
          </Field>

          <div>
            <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{t("dishform_ingredients_title")}</p>
            <p className="text-[11px] text-[#8A8272] mb-2">{t("dishform_ingredients_desc")}</p>
            <datalist id={INGREDIENT_DATALIST_ID}>
              {INGREDIENT_NAMES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div className="flex flex-col gap-2">
              {lines.map((line) => {
                const known = findIngredientByName(line.name);
                const showCustomFields = line.name.trim().length > 0 && !known;
                return (
                  <div key={line.id} className="bg-[#FBF7EF] rounded-lg p-2 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        list={INGREDIENT_DATALIST_ID}
                        value={line.name}
                        onChange={(e) => updateLine(line.id, { name: e.target.value })}
                        className={`${fieldCls} bg-white flex-1 min-w-0`}
                        placeholder={t("dishform_ingredient_name_placeholder")}
                      />
                      <input
                        value={line.grams}
                        onChange={(e) => updateLine(line.id, { grams: e.target.value })}
                        type="number"
                        className={`${fieldCls} bg-white w-20 shrink-0`}
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
                    {showCustomFields && (
                      <div className="pl-0.5">
                        <p className="text-[10.5px] text-[#B0553C] mb-1">{t("dishform_not_in_db")}</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          <LabeledMiniInput label={t("dishform_kcal")} value={line.customCalories} onChange={(v) => updateLine(line.id, { customCalories: v })} />
                          <LabeledMiniInput label={t("dishform_protein_g")} value={line.customProtein} onChange={(v) => updateLine(line.id, { customProtein: v })} />
                          <LabeledMiniInput label={t("dishform_carbs_g")} value={line.customCarbs} onChange={(v) => updateLine(line.id, { customCarbs: v })} />
                          <LabeledMiniInput label={t("dishform_fat_g")} value={line.customFat} onChange={(v) => updateLine(line.id, { customFat: v })} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-3 py-1.5 rounded-full self-start"
              >
                <Plus size={13} />
                {t("dishform_add_ingredient")}
              </button>
            </div>

            {ingredientLines.length > 0 && (
              <div className="mt-3 bg-[#F3E9D2] rounded-xl px-3 py-2.5 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.calories)}</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("dishform_kcal")}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.protein)}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("dishform_protein_g")}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.carbs)}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("dishform_carbs_g")}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{Math.round(nutrition.fat)}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("dishform_fat_g")}</p>
                </div>
              </div>
            )}
          </div>

          <Field label={`${t("dishform_allergy_note")} (${currentLangLabel})`}>
            <input value={allergyNote} onChange={(e) => setAllergyNote(e.target.value)} className={inputCls} placeholder={t("dishform_allergy_placeholder")} />
          </Field>

          <div>
            <p className="text-[12px] font-semibold text-[#5C5240] mb-1.5">{t("dishform_tags")}</p>
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
            {t("dishform_cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold disabled:opacity-40"
          >
            {t("dishform_save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Border/padding/text styles shared by every field. Deliberately excludes
// width so it can be composed with flex-1/w-20/etc. without the two width
// utilities fighting each other (Tailwind doesn't resolve that by class
// order, so w-full silently squashed the ingredient <select> down to ~26px
// the last time this form combined the two).
const fieldCls =
  "border border-black/10 rounded-lg px-3 py-2 text-[13px] text-[#22201B] outline-none focus:border-[#2D5A3D]";
const inputCls = `w-full ${fieldCls}`;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{label}</p>
      {children}
    </label>
  );
}

function VariantGroupEditor({
  rows,
  onAdd,
  onRemove,
  onUpdate,
  title,
  desc,
  addLabel,
  labelPlaceholder,
  showPrice = true,
}: {
  rows: VariantRowState[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, patch: Partial<VariantRowState>) => void;
  title: string;
  desc: string;
  addLabel: string;
  labelPlaceholder: string;
  showPrice?: boolean;
}) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{title}</p>
      <p className="text-[11px] text-[#8A8272] mb-2">{desc}</p>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="bg-[#FBF7EF] rounded-lg p-2 flex items-center gap-2">
            <input
              value={row.label}
              onChange={(e) => onUpdate(row.id, { label: e.target.value })}
              className={`${fieldCls} bg-white flex-1 min-w-0`}
              placeholder={labelPlaceholder}
            />
            {showPrice && (
              <input
                value={row.price}
                onChange={(e) => onUpdate(row.id, { price: e.target.value })}
                type="number"
                step="0.01"
                className={`${fieldCls} bg-white w-24 shrink-0`}
                placeholder="8.00"
              />
            )}
            <input
              value={row.calories}
              onChange={(e) => onUpdate(row.id, { calories: e.target.value })}
              type="number"
              className={`${fieldCls} bg-white w-20 shrink-0`}
              placeholder="kcal"
            />
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              className="w-7 h-7 rounded-full bg-[#F7E9E2] text-[#B0553C] flex items-center justify-center shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-3 py-1.5 rounded-full self-start"
        >
          <Plus size={13} />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function LabeledMiniInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        placeholder="0"
        className={`${fieldCls} bg-white w-full text-center`}
      />
      <p className="text-[9.5px] text-[#8A8272] text-center mt-0.5">{label}</p>
    </label>
  );
}
