import {
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/mutations/useAccountMutations";
import { Account, AccountType } from "@/lib/services/accounts";
import { COLORS } from "@/constants/theme";
import { FormSheetModal } from "@/components/FormSheetModal";
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const ACCOUNT_TYPES: AccountType[] = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS"];

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT_CARD: "Credit card",
  SAVINGS: "Savings",
};

export function AccountModal({
  visible,
  account,
  onClose,
  onSaved,
  onDeleted,
  onMadeDefault,
}: {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onMadeDefault: () => void;
}) {
  const isEditing = !!account;
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [error, setError] = useState("");

  const { mutateAsync: createAccount, isPending: creating } = useCreateAccount();
  const { mutateAsync: updateAccount, isPending: updating } = useUpdateAccount();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const saving = creating || updating;

  useEffect(() => {
    if (visible) {
      setName(account?.name ?? "");
      setType(account?.type ?? "CASH");
      setError("");
    }
  }, [visible, account]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter an account name.");
      return;
    }
    setError("");
    try {
      if (isEditing) {
        await updateAccount({ accountId: account.id, payload: { name: name.trim(), type } });
      } else {
        await createAccount({ name: name.trim(), type });
      }
      onSaved();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    try {
      const result = await deleteAccount({ accountId: account.id });
      if (result.deleted) {
        onDeleted();
        return;
      }

      Alert.alert(
        "Delete account",
        `This will also delete ${result.transactionCount} transaction${
          result.transactionCount === 1 ? "" : "s"
        }. This can't be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteAccount({ accountId: account.id, force: true });
                onDeleted();
              } catch {
                Alert.alert("Error", "Couldn't delete the account.");
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert("Error", "Couldn't check the account's transactions.");
    }
  };

  return (
    <FormSheetModal
      visible={visible}
      title={isEditing ? "Edit account" : "Add account"}
      onClose={onClose}
    >
      <Text className="text-brand-bg text-xs font-medium mb-1.5">Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. HDFC Savings"
        placeholderTextColor={COLORS.placeholder}
        className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 text-sm text-brand-bg mb-5"
      />

      <Text className="text-brand-bg text-xs font-medium mb-1.5">Type</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {ACCOUNT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            className={`px-3.5 py-2 rounded-full border ${
              type === t
                ? "bg-brand-bg border-brand-bg"
                : "bg-white border-[#E8E6DF]"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                type === t ? "text-white" : "text-brand-bg"
              }`}
            >
              {ACCOUNT_TYPE_LABEL[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <Text className="text-brand-coral text-xs mb-3">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="bg-brand-bg rounded-xl py-4 items-center mb-3"
        activeOpacity={0.85}
      >
        <Text className="text-white text-sm font-semibold">
          {saving ? "Saving…" : isEditing ? "Save changes" : "Add account"}
        </Text>
      </TouchableOpacity>

      {isEditing && !account.is_default && (
        <TouchableOpacity onPress={onMadeDefault} className="py-3 items-center">
          <Text className="text-brand-blue text-sm font-medium">
            Make default
          </Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <TouchableOpacity onPress={handleDelete} className="py-3 items-center">
          <Text className="text-brand-coral text-sm font-medium">
            Delete account
          </Text>
        </TouchableOpacity>
      )}
    </FormSheetModal>
  );
}
