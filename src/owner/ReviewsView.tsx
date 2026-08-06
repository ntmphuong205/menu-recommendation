import { useState } from "react";
import { Star, CornerDownRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className={n <= Math.round(value) ? "text-[#E0A83C] fill-[#E0A83C]" : "text-[#D8D0C0]"} />
      ))}
    </div>
  );
}

function ReplyBox({ reviewId, initial }: { reviewId: string; initial: string }) {
  const { replyToReview } = useApp();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-[11.5px] font-medium text-[#2D5A3D] mt-1.5"
      >
        <CornerDownRight size={11} />
        {initial ? t("reviews_mgmt_edit_reply") : t("reviews_mgmt_reply")}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border border-black/10 rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-[#2D5A3D] h-14 resize-none"
        placeholder={t("reviews_mgmt_placeholder")}
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            replyToReview(reviewId, value.trim());
            setEditing(false);
          }}
          className="text-[11.5px] font-semibold text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full"
        >
          {t("reviews_mgmt_save_reply")}
        </button>
        <button onClick={() => setEditing(false)} className="text-[11.5px] font-medium text-[#8A8272]">
          {t("reviews_mgmt_cancel")}
        </button>
      </div>
    </div>
  );
}

export function ReviewsView() {
  const { reviews, menu } = useApp();
  const { t } = useI18n();

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("reviews_mgmt_title")}</h1>
      <p className="text-[13px] text-[#8A8272] mb-6">{t("reviews_mgmt_subtitle")}</p>

      {reviews.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
          {t("reviews_mgmt_empty")}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {reviews.map((r) => {
          const dish = r.dishId ? menu.find((d) => d.id === r.dishId) : undefined;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-[11.5px] text-[#8A8272]">{r.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#B0A794]">
                  {dish && <span className="font-medium text-[#5C5240]">{dish.name}</span>}
                  {r.tableId && <span>{t("chat_table")} {r.tableId}</span>}
                </div>
              </div>
              {r.comment && <p className="text-[13px] text-[#22201B]">{r.comment}</p>}
              {r.reply && (
                <div className="mt-2 pl-2.5 border-l-2 border-[#2D5A3D]/30">
                  <p className="text-[11px] font-semibold text-[#2D5A3D]">{t("reviews_mgmt_your_reply")}</p>
                  <p className="text-[12.5px] text-[#5C5240]">{r.reply}</p>
                </div>
              )}
              <ReplyBox reviewId={r.id} initial={r.reply ?? ""} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
