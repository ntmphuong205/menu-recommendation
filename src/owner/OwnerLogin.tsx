import { useState, type FormEvent } from "react";
import { ChefHat, CheckCircle2 } from "lucide-react";
import { RESTAURANT } from "../data/restaurant";
import type { OwnerAuth } from "../store/useOwnerAuth";
import { useI18n } from "../i18n/I18nContext";

type ScreenMode = "login" | "reset" | "reset-sent";

export function OwnerLogin({
  signIn,
  requestPasswordReset,
}: {
  signIn: OwnerAuth["signIn"];
  requestPasswordReset: OwnerAuth["requestPasswordReset"];
}) {
  const { t } = useI18n();
  const [screen, setScreen] = useState<ScreenMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const errMsg = await signIn(email, password);
    setSubmitting(false);
    if (errMsg) setError(errMsg);
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const errMsg = await requestPasswordReset(resetEmail);
    setSubmitting(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setScreen("reset-sent");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6] p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#2D5A3D] flex items-center justify-center">
              <ChefHat size={22} className="text-white" />
            </div>
            <p className="text-[16px] font-bold text-[#22201B]">{RESTAURANT.name}</p>
            <p className="text-[12px] text-[#8A8272]">
              {screen === "login" ? t("ownerlogin_title") : t("ownerlogin_reset_title")}
            </p>
          </div>

          {screen === "reset-sent" ? (
            <div className="flex flex-col items-center text-center gap-2 py-2">
              <div className="w-12 h-12 rounded-full bg-[#E5F3EA] flex items-center justify-center mb-1">
                <CheckCircle2 size={24} className="text-[#2D5A3D]" />
              </div>
              <p className="text-[13px] text-[#5C5240] leading-relaxed">{t("ownerlogin_reset_sent")}</p>
              <button
                onClick={() => setScreen("login")}
                className="mt-3 text-[12.5px] font-semibold text-[#2D5A3D]"
              >
                {t("ownerlogin_back_to_login")}
              </button>
            </div>
          ) : screen === "reset" ? (
            <form onSubmit={handleResetSubmit}>
              <p className="text-[12px] text-[#8A8272] mb-4 -mt-1">{t("ownerlogin_reset_desc")}</p>
              <label className="block mb-5">
                <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{t("ownerlogin_email")}</p>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
                />
              </label>

              {error && <p className="text-[12px] text-[#B0553C] mb-3">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {submitting ? t("ownerlogin_submitting") : t("ownerlogin_reset_submit")}
              </button>
              <button
                type="button"
                onClick={() => setScreen("login")}
                className="w-full mt-3 text-[12.5px] font-medium text-[#8A8272]"
              >
                {t("ownerlogin_back_to_login")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block mb-3">
                <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{t("ownerlogin_email")}</p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
                />
              </label>
              <label className="block mb-2">
                <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{t("ownerlogin_password")}</p>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
                />
              </label>
              <div className="text-right mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setScreen("reset");
                  }}
                  className="text-[11.5px] font-semibold text-[#2D5A3D]"
                >
                  {t("ownerlogin_forgot_password")}
                </button>
              </div>

              {error && <p className="text-[12px] text-[#B0553C] mb-3">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {submitting ? t("ownerlogin_submitting") : t("ownerlogin_submit")}
              </button>
              <a
                href="/"
                className="mt-2.5 w-full block text-center py-2.5 rounded-full border border-black/10 text-[#5C5240] text-[13px] font-semibold active:scale-[0.98] transition-transform"
              >
                {t("ownerlogin_back_home")}
              </a>
            </form>
          )}
        </div>
        <p className="text-center text-[12px] text-[#8A8272] mt-5">{t("ownerlogin_need_account")}</p>
      </div>
    </div>
  );
}
