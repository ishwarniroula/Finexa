import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getAccounts } from "@/lib/services/accounts";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useAccountsQuery() {
  const { user } = useUser();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.accounts(user?.id),
    queryFn: () => getAccounts(supabase, user!.id),
    enabled: !!user,
  });
}
