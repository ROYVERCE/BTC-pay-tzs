import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/database/client";
import { ProviderError, estimateSats, getMetadata, invoiceIdFromVerifyUrl, readInvoice, requestInvoice } from "@/lib/chapsmart";
import { allow, fail, ok } from "@/lib/security";
import { idempotencyKeySchema, isVodacomMpesa, maskPhone, normalizeTzPhone, quoteSchema } from "@/lib/validation";

const view = (r: any) => ({
  id: r.id, status: r.status, invoice: r.invoice, amountSats: Number(r.amount_sats), amountTzs: r.amount_tzs,
  recipient: r.phone_masked, expiresAt: r.expires_at, supportRef: String(r.id).slice(0, 8).toUpperCase(),
});

export async function POST(req: Request) {
  const w = await currentWallet();
  if (!w) return fail(401, "unauthenticated", "Sign in required.");
  const key = idempotencyKeySchema.safeParse(req.headers.get("idempotency-key"));
  if (!key.success) return fail(400, "missing_idempotency_key", "Idempotency-Key header is required.");
  const p = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail(400, "invalid_request", "Invalid amount.");
  const phone = normalizeTzPhone(p.data.phone);
  if (!phone || !isVodacomMpesa(phone)) return fail(400, "unsupported_number", "Only Vodacom M-Pesa numbers are supported.");

  // Same key from the same wallet returns the same invoice: no duplicate payouts from double clicks or retries.
  const existing = await db().from("payment_requests").select("*").eq("wallet_id", w.id).eq("idempotency_key", key.data).maybeSingle();
  if (existing.data) return ok(view(existing.data));
  if (!allow(`invoice:${w.id}`, 10, 3_600_000)) return fail(429, "rate_limited", "Invoice limit reached. Try again later.");

  try {
    const meta = await getMetadata(phone);
    const est = estimateSats(p.data.amountTzs, meta.currency.multiplier);
    const inv = await requestInvoice(phone, p.data.amountTzs);
    const parsed = readInvoice(inv.pr);
    // Guard against a bad provider rate: refuse invoices far from the quoted estimate.
    if (Math.abs(parsed.amountSats - est) / est > 0.15) return fail(409, "rate_moved", "The rate moved. Please request a new quote.");

    const { data, error } = await db().from("payment_requests").insert({
      wallet_id: w.id, idempotency_key: key.data, phone_masked: maskPhone(phone), invoice: inv.pr,
      provider_invoice_id: invoiceIdFromVerifyUrl(inv.verify), amount_tzs: p.data.amountTzs,
      amount_sats: parsed.amountSats, expires_at: parsed.expiresAt.toISOString(),
    } as any).select("*").single();
    if (error?.code === "23505") {
      const again = await db().from("payment_requests").select("*").eq("wallet_id", w.id).eq("idempotency_key", key.data).maybeSingle();
      if (again.data) return ok(view(again.data));
    }
    if (error || !data) return fail(500, "db_error", "Could not save payment. Do not pay; try again.");
    return ok(view(data), 201);
  } catch (e) {
    if (e instanceof ProviderError) return e.kind === "rejected" ? fail(422, "provider_rejected", e.message) : fail(503, "provider_unavailable", "Could not create invoice. Try again shortly.");
    throw e;
  }
}
