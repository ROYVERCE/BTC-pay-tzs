import { z } from "zod";

/** Accepts 0741234567, +255741234567, 255 741 234 567 -> 255741234567, or null. */
export function normalizeTzPhone(input: string): string | null {
  const s = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (/^0\d{9}$/.test(s)) return "255" + s.slice(1);
  if (/^255\d{9}$/.test(s)) return s;
  return null;
}

/** ChapSmart only accepts Vodacom M-Pesa: 0740-0769 and 0790-0799. */
export function isVodacomMpesa(phone255: string): boolean {
  return /^255(74|75|76|79)\d{7}$/.test(phone255);
}

export function maskPhone(phone255: string): string {
  return `+${phone255.slice(0, 5)}•••${phone255.slice(-3)}`;
}

export const MIN_TZS = 2500;
export const MAX_TZS = 100000;

export const createWalletSchema = z.object({
  displayName: z.string().trim().min(2).max(30).regex(/^[^\u0000-\u001f<>]+$/, "Invalid characters"),
});
export const loginSchema = z.object({ walletId: z.string().trim().toUpperCase().regex(/^BTC-\d{16}$/) });
export const quoteSchema = z.object({
  phone: z.string().min(9).max(20),
  amountTzs: z.number().int().min(MIN_TZS).max(MAX_TZS),
});
export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
