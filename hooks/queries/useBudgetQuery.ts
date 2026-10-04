import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getBudget } from "@/lib/services/budgets";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useBudgetQuery() {
  const { user } = useUser();
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.budget(user?.id),
    queryFn: () => getBudget(supabase, user!.id),
    enabled: !!user,
  });
}
