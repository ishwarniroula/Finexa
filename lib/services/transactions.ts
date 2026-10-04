import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  NewTransaction,
  Transaction,
  TransactionFilters,
  TransactionType,
} from "@/types/transaction";

export type {
  InputMethod,
  NewTransaction,
  Transaction,
  TransactionFilters,
  TransactionType,
} from "@/types/transaction";

export async function getTransactions(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionFilters = {}
) {
  let query = supabase.from("transactions").select("*").eq("user_id", userId);

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

// Insert then adjust the account balance as two sequential awaited calls (no
// Postgres RPC wrapping both yet). If the balance update fails after the
// insert succeeded, we surface that error rather than swallow it so the UI
// can warn the user the transaction was recorded but the balance is stale.
export async function createTransaction(
  supabase: SupabaseClient,
  payload: NewTransaction
) {
  const { data: transaction, error: insertError } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

  if (insertError) return { transaction: null, error: insertError };

  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", payload.account_id)
    .single();

  if (fetchError) return { transaction, error: fetchError };

  const delta = payload.type === "INCOME" ? payload.amount : -payload.amount;

  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ balance: account.balance + delta })
    .eq("id", payload.account_id);

  if (balanceError) return { transaction, error: balanceError };

  return { transaction: transaction as Transaction, error: null };
}

// Delete then reverse the balance effect, same sequential-calls caveat as
// createTransaction — a failure on the reversal is returned, not swallowed.
export async function deleteTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  accountId: string,
  amount: number,
  type: TransactionType
) {
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (deleteError) return { error: deleteError };

  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (fetchError) return { error: fetchError };

  const delta = type === "INCOME" ? -amount : amount;

  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ balance: account.balance + delta })
    .eq("id", accountId);

  if (balanceError) return { error: balanceError };

  return { error: null };
}
