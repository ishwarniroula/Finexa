import { useSupabase } from "@/hooks/useSupabase";
import { upsertBudget } from "@/lib/services/budgets";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpsertBudget() {
  const supabase = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => upsertBudget(supabase, user!.id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
