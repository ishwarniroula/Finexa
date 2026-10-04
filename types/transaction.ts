import type { CategoryKey } from "@/constants/categories";

export type TransactionType = "INCOME" | "EXPENSE";
export type InputMethod = "MANUAL" | "RECEIPT_SCAN" | "VOICE";

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: CategoryKey;
  description: string | null;
  date: string;
  status: string;
  input_method: InputMethod;
  voice_transcript: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionFilters = {
  type?: TransactionType | null;
  accountId?: string | null;
};

export type NewTransaction = {
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: CategoryKey;
  description?: string | null;
  date: string;
  input_method: InputMethod;
  voice_transcript?: string | null;
};

export type ExtractedTransaction = {
  type: TransactionType | null;
  amount: number | null;
  category: CategoryKey | null;
  description: string | null;
  date: string | null;
  transcript: string | null;
};
