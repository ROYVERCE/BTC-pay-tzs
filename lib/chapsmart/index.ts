import { decode } from "light-bolt11-decoder";
import { allow } from "../security";

// Source of truth: https://github.com/bmosha00/chapsmart-lnurl (LNURL-pay + LUD-21 verify).
const BASE = (process.env.CHAPSMART_BASE_URL ?? "https://chapsmart.com/.well-known/lnurlp").replace(/\/$/, "");
/** Documented fee, added on top so the recipient gets the exact TZS. The invoice itself is authoritative. */
export const PROVIDER_FEE_RATE = 0.022;
/** Provider rate limit is 30 req/min per IP. Stay under it across all users of this server. */
const PROVIDER_BUDGET_PER_MIN = 25;

export class ProviderError extends Error {
  constructor(message: string, public kind: "rejected" | "unavailable") { super(message); }
}

async function getJson(url: string): Promise<any> {
  if (!allow("chapsmart:global", PROVIDER_BUDGET_PER_MIN, 60_000)) throw new ProviderError("Provider busy, retry shortly", "unavailable");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (body?.status === "ERROR") throw new ProviderError(String(body.reason ?? "Rejected by provider"), "rejected");
    if (!res.ok || !body) throw new ProviderError("Provider error", "unavailable");
    return body;
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    throw new ProviderError("Provider unreachable", "unavailable");
  } finally { clearTimeout(timer); }
}

export interface LnurlMeta {
  currency: { code: string; minSendable: number; maxSendable: number; multiplier: number }; // multiplier = msats per 1 TZS
  minSendable: number; maxSendable: number;
}
export const getMetadata = (phone255: string): Promise<LnurlMeta> => getJson(`${BASE}/${phone255}`);

export interface ProviderInvoice { pr: string; verify: string; successAction?: { url?: string } }
export const requestInvoice = (phone255: string, amountTzs: number): Promise<ProviderInvoice> =>
  getJson(`${BASE}/${phone255}?amount=${amountTzs}&currency=TZS`);

export function estimateSats(amountTzs: number, multiplierMsatPerTzs: number): number {
  return Math.ceil((amountTzs * multiplierMsatPerTzs * (1 + PROVIDER_FEE_RATE)) / 1000);
}

/** Extract invoice id from the provider's verify URL, refusing any other host (SSRF guard). */
export function invoiceIdFromVerifyUrl(verifyUrl: string): string {
  const u = new URL(verifyUrl);
  if (u.host !== new URL(BASE).host) throw new ProviderError("Unexpected verify host", "unavailable");
  const m = u.pathname.match(/\/verify\/([A-Za-z0-9_-]{6,128})$/);
  if (!m) throw new ProviderError("Unexpected verify URL", "unavailable");
  return m[1];
}

export interface VerifyResult {
  settled: boolean;
  mpesa?: { delivered: boolean; receipt?: string; recipient?: string; amount?: number; completedAt?: string };
}
export const verifyInvoice = (invoiceId: string): Promise<VerifyResult> =>
  getJson(`${BASE}/verify/${encodeURIComponent(invoiceId)}`);

export function readInvoice(pr: string): { amountSats: number; expiresAt: Date } {
  const d: any = decode(pr);
  const sec = (n: string) => d.sections.find((s: any) => s.name === n)?.value;
  const msat = Number(sec("amount"));
  const ts = Number(sec("timestamp"));
  const ttl = Number(sec("expiry") ?? 3600);
  if (!Number.isFinite(msat) || msat <= 0 || !Number.isFinite(ts)) throw new ProviderError("Invalid invoice", "unavailable");
  return { amountSats: Math.ceil(msat / 1000), expiresAt: new Date((ts + ttl) * 1000) };
}
