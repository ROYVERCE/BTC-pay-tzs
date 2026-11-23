import { currentWallet } from "@/lib/auth";
import { PROVIDER_FEE_RATE, ProviderError, estimateSats, getMetadata } from "@/lib/chapsmart";
import { allow, fail, ok } from "@/lib/security";
import { isVodacomMpesa, maskPhone, normalizeTzPhone, quoteSchema } from "@/lib/validation";

const QUOTE_TTL_MS = 60_000; // BTC Pay's own validity window for the on-screen estimate

export async function POST(req: Request) {
  const w = await currentWallet();
  if (!w) return fail(401, "unauthenticated", "Sign in required.");
  if (!allow(`quote:${w.id}`, 20, 60_000)) return fail(429, "rate_limited", "Slow down and try again.");

  const p = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail(400, "invalid_request", "Amount must be a whole number between 2,500 and 100,000 TZS.");
  const phone = normalizeTzPhone(p.data.phone);
  if (!phone || !isVodacomMpesa(phone)) return fail(400, "unsupported_number", "Only Vodacom M-Pesa numbers (07 40-69, 07 90-99) are supported.");

  try {
    const meta = await getMetadata(phone);
    const { minSendable, maxSendable, multiplier } = meta.currency;
    if (p.data.amountTzs < minSendable || p.data.amountTzs > maxSendable)
      return fail(400, "amount_out_of_range", `Amount must be between ${minSendable} and ${maxSendable} TZS.`);
    return ok({
      recipient: maskPhone(phone),
      amountTzs: p.data.amountTzs,
      rateMsatPerTzs: multiplier,
      providerFeePercent: PROVIDER_FEE_RATE * 100,
      btcPayFeePercent: 0,
      estimatedSats: estimateSats(p.data.amountTzs, multiplier),
      note: "Estimate. The exact sats amount is fixed when the invoice is created.",
      quoteExpiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    });
  } catch (e) {
    if (e instanceof ProviderError) return e.kind === "rejected" ? fail(422, "provider_rejected", e.message) : fail(503, "provider_unavailable", "Rate unavailable right now. Try again shortly.");
    throw e;
  }
}
