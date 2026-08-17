/** The restaurant currently piloting this app doesn't need advance table
 *  reservations — remote pre-order + pay-ahead + scheduled pickup covers
 *  that need instead. Code stays in place (ReserveScreen, the reservations
 *  banner in OrdersView, etc.) in case a future restaurant wants it back —
 *  flip this back to true rather than re-writing any of it. */
export const RESERVATIONS_ENABLED = false;
