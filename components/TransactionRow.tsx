import { getCategoryConfig } from "@/constants/categories";
import { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, TouchableOpacity, View } from "react-native";

const INPUT_METHOD_ICON: Record<
  Transaction["input_method"],
  keyof typeof Feather.glyphMap
> = {
  MANUAL: "edit-3",
  RECEIPT_SCAN: "camera",
  VOICE: "mic",
};

export function TransactionRow({
  tx,
  onDelete,
}: {
  tx: Transaction;
  onDelete?: () => void;
}) {
  const config = getCategoryConfig(tx.category);
  const isIncome = tx.type === "INCOME";

  const row = (
    <View
      className="flex-row items-center bg-white rounded-2xl border border-[#E8E6DF] pl-3 pr-3.5 py-4"
      style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${config.color}22` }}
      >
        <Text className="text-lg">{config.icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-brand-bg text-sm font-medium" numberOfLines={1}>
          {tx.description || config.label}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <Feather
            name={INPUT_METHOD_ICON[tx.input_method]}
            size={11}
            color="#8A8D96"
          />
          <View
            className="px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${config.color}1A` }}
          >
            <Text className="text-[10px] font-medium" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
          {tx.is_flagged && (
            <View className="flex-row items-center gap-1 ml-1">
              <Feather name="alert-triangle" size={11} color="#FF6B4A" />
              <Text className="text-brand-coral text-[11px]">Flagged</Text>
            </View>
          )}
        </View>
      </View>

      <Text
        className={`text-sm font-medium ${
          isIncome ? "text-brand-success" : "text-brand-coral"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatPrice(tx.amount)}
      </Text>
    </View>
  );

  if (!onDelete) {
    return <View className="mb-2.5">{row}</View>;
  }

  return (
    <View className="mb-2.5">
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <TouchableOpacity
            onPress={onDelete}
            className="bg-brand-coral rounded-2xl ml-2 w-16 items-center justify-center"
          >
            <Feather name="trash-2" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      >
        {row}
      </Swipeable>
    </View>
  );
}
