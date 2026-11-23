import { db } from "@/lib/database/client";
import { generateWalletId, hashWalletId, startSession } from "@/lib/auth";
import { allow, clientIp, fail, ok } from "@/lib/security";
import { createWalletSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!allow(`create:${clientIp(req)}`, 5, 3_600_000)) return fail(429, "rate_limited", "Too many wallets created. Try again later.");
  const parsed = createWalletSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_name", "Display name must be 2 to 30 characters.");

  for (let attempt = 0; attempt < 5; attempt++) {
    const walletId = generateWalletId();
    const { data, error } = await db().from("wallets")
      .insert({ wallet_hash: hashWalletId(walletId), id_hint: walletId.slice(-4), display_name: parsed.data.displayName } as any)
      .select("id").single();
    if (error?.code === "23505") continue; // astronomically rare collision: draw again
    if (error || !data) return fail(500, "db_error", "Could not create wallet.");
    await startSession((data as any).id);
    // The ID is returned exactly once. It cannot be recovered later.
    return ok({ walletId, displayName: parsed.data.displayName }, 201);
  }
  return fail(500, "id_collision", "Could not create wallet.");
}
