import { TransactionRow } from "@/components/TransactionRow";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { useDeleteTransaction } from "@/hooks/mutations/useTransactionMutations";
import { Transaction, TransactionType } from "@/lib/services/transactions";
import { exportTransactionsToCsv } from "@/lib/utils/exportTransactions";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { eachDayOfInterval, format, startOfDay, startOfMonth } from "date-fns";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = ["All", "Income", "Expense"] as const;

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function currentMonthDays() {
  const today = startOfDay(new Date());
  return eachDayOfInterval({ start: startOfMonth(today), end: today }).map(
    (d) => ({ key: dayKey(d), label: format(d, "d MMM") })
  );
}

export default function TransactionsScreen() {
  const router = useRouter();

  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]>("All");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const typeFilter: TransactionType | null =
    activeFilter === "Income"
      ? "INCOME"
      : activeFilter === "Expense"
      ? "EXPENSE"
      : null;

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery({ type: typeFilter, accountId: activeAccountId });
  const { data: accounts = [], refetch: refetchAccounts } = useAccountsQuery();
  const { mutateAsync: removeTransaction } = useDeleteTransaction();

  const loading = transactionsLoading;
  const refreshing = transactionsRefetching;
  const error = transactionsError;

  const loadData = () => {
    refetchTransactions();
    refetchAccounts();
  };

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const dailyIncomeExpense = useMemo(() => {
    const days = currentMonthDays();
    return days.flatMap(({ key, label }) => {
      const income = transactions
        .filter(
          (tx) => tx.type === "INCOME" && dayKey(new Date(tx.date)) === key
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = transactions
        .filter(
          (tx) => tx.type === "EXPENSE" && dayKey(new Date(tx.date)) === key
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      return [
        { value: income, label, frontColor: "#3DDC84" },
        { value: expense, frontColor: "#FF6B4A" },
      ];
    });
  }, [transactions]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { count } = await exportTransactionsToCsv(transactions);
      if (count === 0) {
        Alert.alert("Nothing to export", "No transactions in the export window.");
      }
    } catch (err) {
      console.error("Export failed:", err);
      Alert.alert("Error", "Couldn't export transactions.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      "Delete transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await removeTransaction(tx);
            if (deleteError) {
              Alert.alert("Error", "Couldn't delete this transaction.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-brand-bg text-xl font-semibold">
            Transactions
          </Text>
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E6DF] items-center justify-center"
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#5C5F68" />
            ) : (
              <Feather name="download" size={15} color="#5C5F68" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2 bg-white rounded-xl border border-[#E8E6DF] px-3.5 py-2.5 mb-2.5">
          <Feather name="search" size={15} color="#8A8D96" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor="#8A8D96"
            className="flex-1 text-xs text-brand-bg"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="#8A8D96" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-2 mb-2.5">
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full border ${
                activeFilter === filter
                  ? "bg-brand-bg border-brand-bg"
                  : "bg-white border-[#E8E6DF]"
              }`}
            >
              <Text
                className={`text-xs ${
                  activeFilter === filter
                    ? "text-white"
                    : "text-brand-text-secondary"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              className={`px-3.5 py-1.5 rounded-full border ${
                activeAccountId === null
                  ? "bg-brand-bg border-brand-bg"
                  : "bg-white border-[#E8E6DF]"
              }`}
            >
              <Text
                className={`text-xs ${
                  activeAccountId === null
                    ? "text-white"
                    : "text-brand-text-secondary"
                }`}
              >
                All Accounts
              </Text>
            </TouchableOpacity>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => setActiveAccountId(account.id)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  activeAccountId === account.id
                    ? "bg-brand-bg border-brand-bg"
                    : "bg-white border-[#E8E6DF]"
                }`}
              >
                <Text
                  className={`text-xs ${
                    activeAccountId === account.id
                      ? "text-white"
                      : "text-brand-text-secondary"
                  }`}
                >
                  {account.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A9EFF" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-10">
          <Feather name="alert-circle" size={32} color="#FF6B4A" />
          <Text className="text-brand-text-muted text-sm mt-3 text-center">
            Couldn&apos;t load transactions.
          </Text>
          <TouchableOpacity
            onPress={() => loadData()}
            className="mt-4 bg-brand-bg rounded-full px-4 py-2"
          >
            <Text className="text-white text-xs font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionRow tx={item} onDelete={() => handleDelete(item)} />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View className="bg-white rounded-2xl border border-[#E8E6DF] p-4 mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-brand-bg text-xs font-medium">
                    Daily income vs expense
                  </Text>
                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-brand-success" />
                      <Text className="text-[10px] text-brand-text-secondary">
                        Income
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-brand-coral" />
                      <Text className="text-[10px] text-brand-text-secondary">
                        Expense
                      </Text>
                    </View>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={dailyIncomeExpense}
                    width={Math.max(dailyIncomeExpense.length * 9, 280)}
                    height={120}
                    barWidth={6}
                    spacing={4}
                    hideYAxisText
                    xAxisColor="#E8E6DF"
                    yAxisColor="transparent"
                    rulesColor="#F0EEE7"
                    noOfSections={3}
                    xAxisLabelTextStyle={{ color: "#8A8D96", fontSize: 7 }}
                    isThreeD={false}
                    roundedTop
                  />
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Feather name="inbox" size={32} color="#BDC3C7" />
              <Text className="text-brand-text-muted text-sm mt-3">
                {search ? "No matching transactions" : "No transactions yet"}
              </Text>
            </View>
          }
        />
      )}

      {/* Add transaction FAB - navigates to the Add tab */}
      <TouchableOpacity
        onPress={() => router.push("/(root)/(tabs)/add-transaction")}
        className="absolute right-5 w-14 h-14 rounded-full bg-brand-bg items-center justify-center shadow-lg"
        style={{ bottom: 90 }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
