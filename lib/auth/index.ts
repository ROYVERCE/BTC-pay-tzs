import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "../database/client";

export const COOKIE = "btcpay_session";
const SESSION_DAYS = 7;

export function generateWalletId(): string {
  let d = "";
  for (let i = 0; i < 16; i++) d += randomInt(0, 10); // CSPRNG, uniform digits
  return `BTC-${d}`;
}

/** The wallet ID is the login credential, so only a keyed hash is stored. */
export function hashWalletId(id: string): string {
  const pepper = process.env.WALLET_PEPPER;
  if (!pepper) throw new Error("WALLET_PEPPER missing");
  return createHmac("sha256", pepper).update(id).digest("hex");
}
export const maskWalletId = (id: string) => `BTC-••••••••••••${id.slice(-4)}`;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function startSession(walletId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const { error } = await db().from("wallet_sessions").insert({ wallet_id: walletId, session_hash: sha(token), expires_at: expires.toISOString() } as any);
  if (error) throw error;
  cookies().set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", expires });
}

export async function endSession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await db().from("wallet_sessions").update({ revoked_at: new Date().toISOString() } as any).eq("session_hash", sha(token));
  cookies().delete(COOKIE);
}

export interface AuthedWallet { id: string; displayName: string; hint: string; status: string; createdAt: string }

export async function currentWallet(): Promise<AuthedWallet | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const { data } = await db().from("wallet_sessions")
    .select("expires_at, revoked_at, wallets(id, display_name, id_hint, status, created_at)")
    .eq("session_hash", sha(token)).maybeSingle();
  const row: any = data;
  const w = row?.wallets;
  if (!row || !w || row.revoked_at || new Date(row.expires_at) < new Date() || w.status !== "active") return null;
  return { id: w.id, displayName: w.display_name, hint: w.id_hint, status: w.status, createdAt: w.created_at };
}
