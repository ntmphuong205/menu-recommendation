import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { useTablesData } from "../store/useTablesData";
import { useI18n } from "../i18n/I18nContext";
import { getStoreSlug } from "../lib/storeSlug";

export function TableQrView() {
  const { t } = useI18n();
  const { tables } = useTablesData();
  const [webQr, setWebQr] = useState("");
  const [tableQrs, setTableQrs] = useState<Record<string, string>>({});

  // Baked into every QR this screen prints, so scanning always resolves to
  // this store regardless of which store the admin happens to be viewing
  // right now (see src/lib/storeSlug.ts / api/index.py's X-Store-Slug).
  const storeSlug = getStoreSlug();
  const storeParam = storeSlug ? `&store=${encodeURIComponent(storeSlug)}` : "";
  const baseUrl = `${window.location.origin}/`;
  const webUrl = `${baseUrl}?mode=web${storeParam}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(webUrl, { width: 240, margin: 1, color: { dark: "#1F3D2B" } }).then((dataUrl) => {
      if (!cancelled) setWebQr(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [webUrl]);

  useEffect(() => {
    if (tables.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        tables.map(async (table) => {
          const url = `${baseUrl}?table=${table.id}&mode=store${storeParam}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: "#1F3D2B" } });
          return [table.id, dataUrl] as const;
        })
      );
      if (!cancelled) setTableQrs(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [tables, baseUrl, storeParam]);

  const downloadQr = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("owner_nav_tables")}</h1>
      <p className="text-[13px] text-[#8A8272] mb-6">{t("tableqr_desc")}</p>

      <div className="mb-8">
        <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-3">{t("tableqr_web_heading")}</h2>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex items-center gap-4 max-w-md">
          {webQr ? (
            <img src={webQr} alt="General web QR code" className="w-28 h-28 shrink-0" />
          ) : (
            <div className="w-28 h-28 bg-[#F5F1E6] animate-pulse rounded-lg shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-[#B0A794] break-all">{webUrl}</p>
            <button
              onClick={() => webQr && downloadQr(webQr, "menu-web-qr.png")}
              disabled={!webQr}
              className="mt-2 flex items-center gap-1 text-[11.5px] font-medium text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full disabled:opacity-40"
            >
              <Download size={12} />
              {t("tableqr_download")}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-3">{t("tableqr_table_heading")}</h2>
        {tables.length === 0 && (
          <p className="text-[13px] text-[#B0A794] bg-white rounded-2xl border border-black/5 p-6 text-center">
            {t("tableqr_empty")}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex flex-col items-center gap-2">
              <p className="text-[13px] font-bold text-[#22201B]">{t("chat_table")} {table.id}</p>
              {tableQrs[table.id] ? (
                <img src={tableQrs[table.id]} alt={`QR code for table ${table.id}`} className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-[#F5F1E6] animate-pulse rounded-lg" />
              )}
              <p className="text-[10px] text-[#B0A794] break-all text-center">
                {baseUrl}?table={table.id}&mode=store{storeParam}
              </p>
              <button
                onClick={() => tableQrs[table.id] && downloadQr(tableQrs[table.id], `table-${table.id}-qr.png`)}
                disabled={!tableQrs[table.id]}
                className="flex items-center gap-1 text-[11.5px] font-medium text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full disabled:opacity-40"
              >
                <Download size={12} />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
