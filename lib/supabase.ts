import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to your .env file."
  );
}

// Plain anon client — not used much in Welth since almost everything is private,
// but kept around for any public/unauthenticated reads later.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authenticated client — pass this a getToken function from Clerk's useAuth().
// This attaches the Clerk JWT to every Supabase request so RLS can identify the user
// via auth.jwt()->>'sub'.
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return getToken();
    },
  });
}
