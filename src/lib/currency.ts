const CURRENCY_LOCALES: Record<string, string> = { VND: "vi-VN", KRW: "ko-KR" };

/** Formats a menu price using the store's own currency — never assume USD,
 *  a store's menu.currency may be VND, KRW, etc. */
export function formatPrice(price: number, currency: string = "USD"): string {
  const locale = CURRENCY_LOCALES[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(price);
}
