import { db } from "@/lib/database/client";
import { hashWalletId, startSession } from "@/lib/auth";
import { allow, clientIp, fail, ok } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const ip = clientIp(req);
  // The ID is the only credential, so guessing must be expensive.
  if (!allow(`login:${ip}`, 5, 900_000) || !allow("login:global", 200, 900_000))
    return fail(429, "rate_limited", "Too many attempts. Try again in 15 minutes.");
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_id", "Wallet ID must look like BTC-0000000000000000.");

  const { data } = await db().from("wallets").select("id, display_name, status").eq("wallet_hash", hashWalletId(parsed.data.walletId)).maybeSingle();
  const w: any = data;
  if (!w || w.status !== "active") return fail(401, "invalid_credentials", "Wallet not found.");
  await startSession(w.id);
  return ok({ displayName: w.display_name });
}
