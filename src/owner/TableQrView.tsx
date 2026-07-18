import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { usePersistentState } from "../store/usePersistentState";
import { useI18n } from "../i18n/I18nContext";

export function TableQrView() {
  const { t } = useI18n();
  const [tableCount, setTableCount] = usePersistentState("fb_table_count", 8);
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});

  const baseUrl = `${window.location.origin}/`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        Array.from({ length: tableCount }, (_, i) => i + 1).map(async (n) => {
          const url = `${baseUrl}?table=${n}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: "#1F3D2B" } });
          return [n, dataUrl] as const;
        })
      );
      if (!cancelled) setQrCodes(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [tableCount, baseUrl]);

  const downloadQr = (n: number) => {
    const link = document.createElement("a");
    link.href = qrCodes[n];
    link.download = `table-${n}-qr.png`;
    link.click();
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("owner_nav_tables")}</h1>
          <p className="text-[13px] text-[#8A8272]">
            Print one QR code per table. Scanning it opens the customer menu with the table number pre-filled.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[#5C5240]">
          Number of tables
          <input
            type="number"
            min={1}
            max={50}
            value={tableCount}
            onChange={(e) => setTableCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
            className="w-16 border border-black/10 rounded-lg px-2 py-1.5 text-[13px] outline-none focus:border-[#2D5A3D]"
          />
        </label>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex flex-col items-center gap-2">
            <p className="text-[13px] font-bold text-[#22201B]">Table {n}</p>
            {qrCodes[n] ? (
              <img src={qrCodes[n]} alt={`QR code for table ${n}`} className="w-32 h-32" />
            ) : (
              <div className="w-32 h-32 bg-[#F5F1E6] animate-pulse rounded-lg" />
            )}
            <p className="text-[10px] text-[#B0A794] break-all text-center">{baseUrl}?table={n}</p>
            <button
              onClick={() => downloadQr(n)}
              disabled={!qrCodes[n]}
              className="flex items-center gap-1 text-[11.5px] font-medium text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full disabled:opacity-40"
            >
              <Download size={12} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
