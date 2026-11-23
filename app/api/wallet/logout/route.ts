import { endSession } from "@/lib/auth";
import { ok } from "@/lib/security";

export async function POST() { await endSession(); return ok({ loggedOut: true }); }
