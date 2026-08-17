/** Builds a VietQR bank-transfer QR image URL — img.vietqr.io is a free,
 *  no-auth-required public service (no merchant registration needed, unlike
 *  VNPay/MoMo/ZaloPay). The image itself encodes the bank, account, amount,
 *  and transfer note, so scanning it in any Vietnamese banking app
 *  pre-fills the whole transfer. See https://vietqr.io for the API. */
export function vietQrImageUrl(params: {
  bankBin: string;
  accountNumber: string;
  accountHolder?: string;
  amountVnd: number;
  note: string;
}): string {
  const { bankBin, accountNumber, accountHolder, amountVnd, note } = params;
  const query = new URLSearchParams({
    amount: String(Math.round(amountVnd)),
    addInfo: note,
  });
  if (accountHolder) query.set("accountName", accountHolder);
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?${query.toString()}`;
}
