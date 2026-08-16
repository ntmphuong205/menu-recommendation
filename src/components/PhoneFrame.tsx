import { Wifi, Signal, BatteryFull } from "lucide-react";
import type { ReactNode } from "react";

/** Decorative iPhone mockup — shown only on wide (desktop/tablet) viewports,
 *  for demo/preview purposes. Real customers almost always open this on an
 *  actual phone, where a fake bezel + fake 9:41 status bar around the real
 *  app would just be broken chrome, not a feature — below the md breakpoint
 *  this renders full-screen with none of that. Renders `children` exactly
 *  once either way, so app state (cart, tabs, etc.) never gets duplicated
 *  across a hidden/visible pair. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full h-screen md:h-auto md:w-auto">
      <div className="relative w-full h-full bg-[#FBF7EF] md:bg-black md:w-[393px] md:h-[852px] md:rounded-[62px] md:p-[14px] md:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5),0_0_0_2px_rgba(255,255,255,0.05)]">
        <div className="relative w-full h-full bg-[#FBF7EF] md:rounded-[48px] overflow-hidden flex flex-col">
          {/* Status bar — decorative, desktop preview only */}
          <div className="hidden md:flex relative items-center justify-between px-8 pt-3 pb-1 z-30 shrink-0">
            <span className="text-[15px] font-semibold text-[#1F2A24]">9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[120px] h-[34px] bg-black rounded-full" />
            <div className="flex items-center gap-1.5 text-[#1F2A24]">
              <Signal size={15} strokeWidth={2.5} />
              <Wifi size={15} strokeWidth={2.5} />
              <BatteryFull size={20} strokeWidth={2} />
            </div>
          </div>

          {/* Screen content */}
          <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
