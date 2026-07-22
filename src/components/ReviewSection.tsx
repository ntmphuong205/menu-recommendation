import { useState } from "react";
import { Star } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "text-[#E0A83C] fill-[#E0A83C]" : "text-[#D8D0C0]"}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ dishId }: { dishId: string }) {
  const { reviews, addReview, getDishRating } = useApp();
  const { t } = useI18n();
  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const summary = getDishRating(dishId);
  const dishReviews = reviews.filter((r) => r.dishId === dishId).slice(0, 3);

  const submit = () => {
    addReview(dishId, rating, comment.trim());
    setSubmitted(true);
    setWriting(false);
    setComment("");
    setRating(5);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12.5px] font-semibold text-[#22201B]">{t("review_title")}</p>
        {summary.count > 0 && (
          <div className="flex items-center gap-1.5">
            <Stars value={summary.average} />
            <span className="text-[12px] text-[#8A8272]">
              {summary.average.toFixed(1)} ({summary.count})
            </span>
          </div>
        )}
      </div>

      {submitted && <p className="text-[12px] text-[#2D5A3D] font-medium mb-2">{t("review_thanks")}</p>}

      {dishReviews.length === 0 && !submitted && (
        <p className="text-[12px] text-[#B0A794] mb-2">{t("review_none")}</p>
      )}

      <div className="flex flex-col gap-2 mb-2">
        {dishReviews.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-black/5 px-3 py-2">
            <Stars value={r.rating} size={11} />
            {r.comment && <p className="text-[12px] text-[#5C5240] mt-1">{r.comment}</p>}
          </div>
        ))}
      </div>

      {!writing ? (
        <button
          onClick={() => setWriting(true)}
          className="text-[12px] font-semibold text-[#2D5A3D] bg-[#E5F3EA] px-3 py-1.5 rounded-full"
        >
          {t("review_write")}
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-black/5 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={20} className={n <= rating ? "text-[#E0A83C] fill-[#E0A83C]" : "text-[#D8D0C0]"} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("review_placeholder")}
            className="w-full border border-black/10 rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-[#2D5A3D] h-14 resize-none"
          />
          <button
            onClick={submit}
            className="bg-[#2D5A3D] text-white text-[12.5px] font-semibold py-2 rounded-full active:scale-95 transition-transform"
          >
            {t("review_submit")}
          </button>
        </div>
      )}
    </div>
  );
}
