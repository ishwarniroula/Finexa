import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getTransactions, TransactionFilters } from "@/lib/services/transactions";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useTransactionsQuery(filters: TransactionFilters = {}) {
  const { user } = useUser();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.transactions(user?.id, filters),
    queryFn: () => getTransactions(supabase, user!.id, filters),
    enabled: !!user,
  });
}
