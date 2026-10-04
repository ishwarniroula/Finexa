import { useSupabase } from "@/hooks/useSupabase";
import {
  AccountType,
  createAccount,
  deleteAccount,
  setDefaultAccount,
  updateAccount,
} from "@/lib/services/accounts";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateAccount() {
  const supabase = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; type: AccountType }) =>
      createAccount(supabase, user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: { name: string; type: AccountType };
    }) => updateAccount(supabase, accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      force = false,
    }: {
      accountId: string;
      force?: boolean;
    }) => deleteAccount(supabase, accountId, { force }),
    onSuccess: (result) => {
      if (!result.deleted) return;
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useSetDefaultAccount() {
  const supabase = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      setDefaultAccount(supabase, user!.id, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
