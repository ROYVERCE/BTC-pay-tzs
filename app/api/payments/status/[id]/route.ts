import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/database/client";
import { ProviderError, verifyInvoice } from "@/lib/chapsmart";
import { fail, ok } from "@/lib/security";

const POLL_MIN_MS = 4_000;          // provider allows 30 req/min per IP: never hit it per client poll
const STALE_PROCESSING_MS = 10 * 60_000;
const TERMINAL = new Set(["delivered", "expired", "failed"]);

const view = (r: any, extra: object = {}) => ({
  id: r.id, status: r.status, amountSats: Number(r.amount_sats), amountTzs: r.amount_tzs, recipient: r.phone_masked,
  expiresAt: r.expires_at, receipt: r.mpesa_receipt, recipientName: r.mpesa_recipient, deliveredAt: r.delivered_at,
  supportRef: String(r.id).slice(0, 8).toUpperCase(), ...extra,
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const w = await currentWallet();
  if (!w) return fail(401, "unauthenticated", "Sign in required.");
  if (!/^[0-9a-f-]{36}$/.test(params.id)) return fail(400, "invalid_id", "Invalid payment id.");

  // Scoped to the wallet: other customers' payments are indistinguishable from nonexistent.
  const { data } = await db().from("payment_requests").select("*").eq("id", params.id).eq("wallet_id", w.id).maybeSingle();
  let r: any = data;
  if (!r) return fail(404, "not_found", "Payment not found.");
  if (TERMINAL.has(r.status)) return ok(view(r));
  if (r.last_polled_at && Date.now() - new Date(r.last_polled_at).getTime() < POLL_MIN_MS) return ok(view(r));

  try {
    const v = await verifyInvoice(r.provider_invoice_id);
    const now = new Date().toISOString();
    let patch: Record<string, unknown> = { last_polled_at: now };
    if (v.settled && v.mpesa?.delivered) {
      patch = { ...patch, status: "delivered", paid_at: r.paid_at ?? now, mpesa_receipt: v.mpesa.receipt ?? null, mpesa_recipient: v.mpesa.recipient ?? null, delivered_at: v.mpesa.completedAt ?? now };
    } else if (v.settled) {
      patch = { ...patch, status: "paid_processing", paid_at: r.paid_at ?? now };
    } else if (new Date(r.expires_at) < new Date()) {
      patch = { ...patch, status: "expired" };
    }
    const upd = await db().from("payment_requests").update(patch as any).eq("id", r.id).select("*").single();
    r = upd.data ?? r;
    const stale = r.status === "paid_processing" && r.paid_at && Date.now() - new Date(r.paid_at).getTime() > STALE_PROCESSING_MS;
    return ok(view(r, stale ? { needsSupport: true } : {}));
  } catch (e) {
    if (e instanceof ProviderError) return ok(view(r, { providerUnavailable: true })); // never mark a paid payment failed on a provider hiccup
    throw e;
  }
}
