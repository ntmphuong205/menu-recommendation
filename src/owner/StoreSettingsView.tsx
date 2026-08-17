import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plus, X, Save, Upload } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useStoreData } from "../store/useStoreData";
import { useI18n } from "../i18n/I18nContext";
import { VIETNAM_BANKS } from "../data/banks";

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 bg-[#F5F1E6] text-[#5C5240] text-[11.5px] font-medium px-2.5 py-1 rounded-full">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-[#B0A794]">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={inputCls}
        />
        <button onClick={add} type="button" className="shrink-0 w-9 h-9 rounded-lg bg-[#E5F3EA] text-[#2D5A3D] flex items-center justify-center">
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

/** Store name/hours/description/menu categories, plus the AI recommendation
 *  keywords Gemini is grounded on in every chat reply — the admin form Wexit
 *  had but this merge hadn't exposed a frontend for yet. English in, ko/vi
 *  auto-translated on save (same convention as the menu editor). */
export function StoreSettingsView() {
  const { store } = useApp();
  const { t } = useI18n();
  const { keywords, updateStore, updateKeywords } = useStoreData();

  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [localKeywords, setLocalKeywords] = useState<string[]>([]);
  const [bankBin, setBankBin] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankQrImage, setBankQrImage] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // useStoreData() polls every 20s, handing back a fresh `store` object
  // each time even when nothing changed — seeding the form on every one of
  // those would silently overwrite whatever the owner is mid-typing. Only
  // seed once, the first time store data arrives.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!store || seededRef.current) return;
    seededRef.current = true;
    setName(store.name_en || store.name);
    setHours(store.hours_en || store.hours);
    setDescription(store.description_en || store.description);
    setCategories(store.menu_categories ?? []);
    setBankBin(store.bank_bin ?? "");
    setBankAccountNumber(store.bank_account_number ?? "");
    setBankAccountHolder(store.bank_account_holder ?? "");
    setBankQrImage(store.bank_qr_image ?? "");
    setOpeningTime(store.opening_time || "09:00");
    setClosingTime(store.closing_time || "22:00");
  }, [store]);

  const handleQrUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBankQrImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Same polling-clobbers-edits issue as the store fields above — seed once,
  // and only once real data has actually arrived (keywords is null, not [],
  // until the first poll resolves).
  const keywordsSeededRef = useRef(false);
  useEffect(() => {
    if (!keywords || keywordsSeededRef.current) return;
    keywordsSeededRef.current = true;
    setLocalKeywords(keywords);
  }, [keywords]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        updateStore({
          name,
          hours,
          description,
          menu_categories: categories,
          bank_bin: bankBin,
          bank_account_number: bankAccountNumber,
          bank_account_holder: bankAccountHolder,
          bank_qr_image: bankQrImage || null,
          opening_time: openingTime,
          closing_time: closingTime,
        }),
        updateKeywords(localKeywords),
      ]);
      setSaved(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("store_settings_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("store_settings_title")}</h1>
          <p className="text-[13px] text-[#8A8272]">{t("store_settings_subtitle")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !store}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-[#2D5A3D] px-3.5 py-2 rounded-full disabled:opacity-50 active:scale-95 transition-transform shrink-0"
        >
          <Save size={14} />
          {saving ? t("store_settings_saving") : t("store_settings_save")}
        </button>
      </div>

      {!store ? (
        <p className="text-[13px] text-[#B0A794]">{t("store_settings_loading")}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-3.5">
          {saved && <p className="text-[12px] font-medium text-[#2D5A3D]">{t("store_settings_saved")}</p>}
          <Field label={t("store_settings_field_name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("store_settings_field_hours")}>
            <input value={hours} onChange={(e) => setHours(e.target.value)} className={inputCls} placeholder={t("store_settings_field_hours_placeholder")} />
          </Field>
          <Field label={t("store_settings_pickup_window")}>
            <p className="text-[11px] text-[#8A8272] mb-1.5 -mt-1">{t("store_settings_pickup_window_desc")}</p>
            <div className="flex items-center gap-2">
              <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} className={inputCls} />
              <span className="text-[12px] text-[#8A8272] shrink-0">{t("store_settings_pickup_window_to")}</span>
              <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className={inputCls} />
            </div>
          </Field>
          <Field label={t("store_settings_field_description")}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} h-16 resize-none`}
            />
          </Field>
          <Field label={t("store_settings_field_categories")}>
            <TagInput values={categories} onChange={setCategories} placeholder={t("store_settings_field_categories_placeholder")} />
          </Field>
          <Field label={t("store_settings_field_keywords")}>
            <p className="text-[11px] text-[#8A8272] mb-1.5 -mt-1">{t("store_settings_field_keywords_desc")}</p>
            <TagInput values={localKeywords} onChange={setLocalKeywords} placeholder={t("store_settings_field_keywords_placeholder")} />
          </Field>

          <div className="border-t border-black/5 pt-3.5 mt-1 flex flex-col gap-3.5">
            <div>
              <p className="text-[13px] font-bold text-[#22201B]">{t("store_settings_bank_title")}</p>
              <p className="text-[11px] text-[#8A8272] mt-0.5">{t("store_settings_bank_desc")}</p>
            </div>
            <Field label={t("store_settings_bank_name")}>
              <select value={bankBin} onChange={(e) => setBankBin(e.target.value)} className={inputCls}>
                <option value="">{t("store_settings_bank_select")}</option>
                {VIETNAM_BANKS.map((bank) => (
                  <option key={bank.bin} value={bank.bin}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("store_settings_bank_account_number")}>
              <input
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.trim())}
                className={inputCls}
                placeholder="0123456789"
              />
            </Field>
            <Field label={t("store_settings_bank_account_holder")}>
              <input
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className={inputCls}
                placeholder="NGUYEN VAN A"
              />
            </Field>
            <Field label={t("store_settings_bank_qr_upload")}>
              <p className="text-[11px] text-[#8A8272] mb-1.5 -mt-0.5">{t("store_settings_bank_qr_upload_desc")}</p>
              <div className="flex items-center gap-3">
                {bankQrImage && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#EFE9D8] shrink-0 border border-black/10">
                    <img src={bankQrImage} alt="QR preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className={`${inputCls} flex items-center gap-2 cursor-pointer text-[#5C5240] w-auto`}>
                  <Upload size={14} />
                  {t("store_settings_bank_qr_choose_file")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleQrUpload(e.target.files?.[0])}
                  />
                </label>
                {bankQrImage && (
                  <button
                    type="button"
                    onClick={() => setBankQrImage("")}
                    className="text-[11.5px] font-medium text-[#B0553C]"
                  >
                    {t("store_settings_bank_qr_remove")}
                  </button>
                )}
              </div>
            </Field>
          </div>
        </div>
      )}
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
