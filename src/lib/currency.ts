const CURRENCY_LOCALES: Record<string, string> = { VND: "vi-VN", KRW: "ko-KR" };

/** Formats a menu price using the store's own currency — never assume USD,
 *  a store's menu.currency may be VND, KRW, etc. */
export function formatPrice(price: number, currency: string = "USD"): string {
  const locale = CURRENCY_LOCALES[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(price);
}

/** Formats a dish's price for list views — a single price, or "min – max"
 *  when it has size variants at different prices. */
export function formatPriceRange(prices: number[], currency: string = "USD"): string {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min, currency);
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`;
}
