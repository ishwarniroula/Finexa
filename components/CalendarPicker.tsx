import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";

export function CalendarPicker({
  value,
  onChange,
  maximumDate,
}: {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
}) {
  const defaultStyles = useDefaultStyles("light");

  return (
    <DateTimePicker
      mode="single"
      date={value}
      maxDate={maximumDate}
      onChange={({ date }) =>
        date && onChange(new Date(date as string | number | Date))
      }
      styles={{
        ...defaultStyles,
        today: { borderWidth: 1, borderColor: "#1A1D26" },
      }}
    />
  );
}
