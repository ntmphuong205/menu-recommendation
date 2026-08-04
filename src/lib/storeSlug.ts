const STORAGE_KEY = "admin_store_slug";

// Customer links carry ?store=<slug> (see TableQrView). The admin app has
// no such param — it's resolved after login from /api/my-stores instead —
// so fall back to whatever store the admin picked last time, persisted
// across reloads within that session.
let currentSlug: string =
  new URLSearchParams(window.location.search).get("store")?.trim() ||
  (window.location.pathname.startsWith("/admin") ? localStorage.getItem(STORAGE_KEY) || "" : "");

export function getStoreSlug(): string {
  return currentSlug;
}

/** Called once the admin app knows which store it's operating on (auto-
 *  selected or chosen from a switcher) — persists so a page reload doesn't
 *  lose it. Customer-side slug (from the URL) is never persisted this way,
 *  since it should always come fresh from whatever QR was scanned. */
export function setAdminStoreSlug(slug: string): void {
  currentSlug = slug;
  localStorage.setItem(STORAGE_KEY, slug);
}
