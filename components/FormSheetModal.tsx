import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function FormSheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="bg-brand-body rounded-t-2xl px-5 pt-5 pb-8">
          <Text className="text-brand-bg text-base font-semibold mb-4">
            {title}
          </Text>

          {children}

          <TouchableOpacity
            onPress={onClose}
            style={{
              alignSelf: "stretch",
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              className="text-brand-text-secondary text-sm"
              style={{
                color: "#8A8D96",
                fontSize: 14,
                lineHeight: 20,
                textAlign: "center",
                includeFontPadding: true,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
