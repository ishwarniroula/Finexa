import { createClerkSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/expo";
import { useMemo } from "react";

export function useSupabase() {
  const { getToken } = useAuth();

  const client = useMemo(
    () => createClerkSupabaseClient(() => getToken()),
    [] // empty deps — create the client once, getToken is captured in the closure
  );

  return client;
}
