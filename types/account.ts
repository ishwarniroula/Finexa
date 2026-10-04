export type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "SAVINGS";

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  is_default: boolean;
  created_at: string;
};
