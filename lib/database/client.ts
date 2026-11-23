import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any, "public", any> | null = null;
/** Service-role client. Server only: never import from client components. */
export function db(): SupabaseClient<any, "public", any> {
  if (!client) {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
