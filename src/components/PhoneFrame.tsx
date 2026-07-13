import { Wifi, Signal, BatteryFull } from "lucide-react";
import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div
        className="relative w-[393px] h-[852px] bg-black rounded-[62px] p-[14px] shadow-2xl"
        style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.05)" }}
      >
        <div className="relative w-full h-full bg-[#FBF7EF] rounded-[48px] overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="relative flex items-center justify-between px-8 pt-3 pb-1 z-30 shrink-0">
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
