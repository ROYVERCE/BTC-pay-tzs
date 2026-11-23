import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/database/client";
import { fail, ok } from "@/lib/security";

export async function GET() {
  const w = await currentWallet();
  if (!w) return fail(401, "unauthenticated", "Sign in required.");
  const { data, error } = await db().from("payment_requests")
    .select("id, status, phone_masked, amount_tzs, amount_sats, mpesa_receipt, created_at, delivered_at")
    .eq("wallet_id", w.id).order("created_at", { ascending: false }).limit(50);
  if (error) return fail(500, "db_error", "Could not load history.");
  return ok({ transactions: (data as any[]).map((r) => ({
    reference: String(r.id).slice(0, 8).toUpperCase(), id: r.id, service: "Send BTC to M-Pesa", status: r.status,
    recipient: r.phone_masked, amountTzs: r.amount_tzs, amountSats: Number(r.amount_sats), receipt: r.mpesa_receipt, createdAt: r.created_at,
  })) });
}
