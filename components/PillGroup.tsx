import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export type PillOption<T extends string> = {
  key: T;
  label: string;
  icon?: string;
};

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  scrollable = true,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (key: T) => void;
  scrollable?: boolean;
}) {
  const row = (
    <View className="flex-row gap-2">
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => onChange(option.key)}
          className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
            value === option.key
              ? "bg-brand-bg border-brand-bg"
              : "bg-white border-[#E8E6DF]"
          }`}
        >
          {option.icon && <Text className="text-xs">{option.icon}</Text>}
          <Text
            className={`text-xs ${
              value === option.key ? "text-white" : "text-brand-text-secondary"
            }`}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!scrollable) return row;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {row}
    </ScrollView>
  );
}
