import { useEffect, useState } from "react";
import { Store, LogOut, AlertCircle } from "lucide-react";
import { apiClient, type ApiStoreSummary } from "../lib/apiClient";
import { setAdminStoreSlug } from "../lib/storeSlug";

/**
 * Resolves which store this admin login belongs to before rendering the
 * dashboard. One store: skips straight through. Several: lets them pick
 * (an admin can be staff at more than one restaurant). None: tells them to
 * contact whoever provisioned their account — see db/new_store_template.sql.
 */
export function StoreSwitcher({
  onSelect,
  onSignOut,
}: {
  onSelect: (slug: string) => void;
  onSignOut: () => void;
}) {
  const [stores, setStores] = useState<ApiStoreSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getMyStores()
      .then((res) => {
        if (cancelled) return;
        if (res.stores.length === 1) {
          setAdminStoreSlug(res.stores[0].slug);
          onSelect(res.stores[0].slug);
          return;
        }
        setStores(res.stores);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (slug: string) => {
    setAdminStoreSlug(slug);
    onSelect(slug);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6] p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="w-11 h-11 rounded-full bg-[#E5F3EA] flex items-center justify-center mb-3">
          <Store size={20} className="text-[#2D5A3D]" />
        </div>

        {error ? (
          <>
            <h1 className="text-[16px] font-bold text-[#22201B] mb-1">Couldn't load your stores</h1>
            <p className="text-[12.5px] text-[#8A8272] mb-4">Check your connection and try signing in again.</p>
          </>
        ) : stores === null ? (
          <p className="text-[13px] text-[#B0A794]">Loading your stores…</p>
        ) : stores.length === 0 ? (
          <>
            <h1 className="text-[16px] font-bold text-[#22201B] mb-1">No store access yet</h1>
            <p className="text-[12.5px] text-[#8A8272] mb-4 leading-relaxed flex items-start gap-1.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              This account isn't linked to any store's staff list yet. Ask whoever manages the platform to add you.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[16px] font-bold text-[#22201B] mb-1">Select a store</h1>
            <p className="text-[12.5px] text-[#8A8272] mb-4">You manage more than one — pick which to open.</p>
            <div className="flex flex-col gap-2 mb-2">
              {stores.map((s) => (
                <button
                  key={s.store_id}
                  onClick={() => pick(s.slug)}
                  className="text-left px-4 py-3 rounded-xl bg-[#F5F1E6] text-[13.5px] font-medium text-[#22201B] active:scale-[0.98] transition-transform"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={onSignOut}
          className="flex items-center gap-2 mt-3 text-[12px] font-medium text-[#8A8272]"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  );
}
