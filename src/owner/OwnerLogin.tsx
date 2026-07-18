import { useState, type FormEvent } from "react";
import { ChefHat } from "lucide-react";
import { RESTAURANT } from "../data/restaurant";
import type { OwnerAuth } from "../store/useOwnerAuth";

export function OwnerLogin({ signIn }: { signIn: OwnerAuth["signIn"] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6]">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-black/5 p-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#2D5A3D] flex items-center justify-center">
            <ChefHat size={22} className="text-white" />
          </div>
          <p className="text-[16px] font-bold text-[#22201B]">{RESTAURANT.name}</p>
          <p className="text-[12px] text-[#8A8272]">Owner Dashboard login</p>
        </div>

        <label className="block mb-3">
          <p className="text-[12px] font-semibold text-[#5C5240] mb-1">Email</p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
          />
        </label>
        <label className="block mb-5">
          <p className="text-[12px] font-semibold text-[#5C5240] mb-1">Password</p>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2D5A3D]"
          />
        </label>

        {error && <p className="text-[12px] text-[#B0553C] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
