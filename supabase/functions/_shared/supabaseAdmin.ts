import { createClient } from "jsr:@supabase/supabase-js@2";

// Service-role client: bypasses RLS. Only used inside scheduled edge
// functions that need to scan across all users, never exposed to the app.
export function createSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey);
}
