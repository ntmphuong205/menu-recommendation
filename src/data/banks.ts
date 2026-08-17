/** Napas bank BIN codes for the most common Vietnamese banks, used to build
 *  VietQR bank-transfer QR images (img.vietqr.io/image/<bin>-<account>-...).
 *  Not exhaustive — if a bank isn't listed, the admin can type its BIN
 *  directly via the "Khác" option. Double-check against VietQR's official
 *  bank list (https://vietqr.io/danh-sach-ngan-hang) before relying on this
 *  for real transactions — a wrong BIN routes the transfer to the wrong bank. */
export interface Bank {
  bin: string;
  name: string;
}

export const VIETNAM_BANKS: Bank[] = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
];

export function bankNameForBin(bin: string): string {
  return VIETNAM_BANKS.find((b) => b.bin === bin)?.name ?? bin;
}
