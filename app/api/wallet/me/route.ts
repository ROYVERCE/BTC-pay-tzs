import { currentWallet, maskWalletId } from "@/lib/auth";
import { fail, ok } from "@/lib/security";

export async function GET() {
  const w = await currentWallet();
  if (!w) return fail(401, "unauthenticated", "Sign in required.");
  return ok({ displayName: w.displayName, walletId: `BTC-••••••••••••${w.hint}`, status: w.status });
}
