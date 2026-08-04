import { useState } from "react";
import { X, KeyRound, CheckCircle2 } from "lucide-react";
import { useOwnerAuth } from "../store/useOwnerAuth";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useOwnerAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const message = await changePassword(newPassword);
    setSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 flex items-center justify-center">
          <X size={14} className="text-[#22201B]" />
        </button>

        {done ? (
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <div className="w-14 h-14 rounded-full bg-[#E5F3EA] flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#2D5A3D]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#22201B]">Password changed</h2>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#2D5A3D] flex items-center justify-center">
                <KeyRound size={16} className="text-white" />
              </div>
              <h2 className="text-[16px] font-bold text-[#22201B]">Change password</h2>
            </div>

            <div className="flex flex-col gap-3">
              <label className="block">
                <p className="text-[12px] font-semibold text-[#5C5240] mb-1">New password</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
                  placeholder="At least 6 characters"
                  autoFocus
                />
              </label>
              <label className="block">
                <p className="text-[12px] font-semibold text-[#5C5240] mb-1">Confirm new password</p>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
                />
              </label>

              {error && <p className="text-[12px] text-[#B0553C] bg-[#F7E9E2] rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={submit}
                disabled={submitting || !newPassword || !confirmPassword}
                className="mt-1 w-full bg-[#2D5A3D] text-white font-semibold text-[13.5px] py-3 rounded-full active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save new password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
