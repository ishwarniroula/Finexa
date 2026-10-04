import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { askAssistant } from "@/lib/services/assistant";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "How much did I spend on food this month?",
  "What's my biggest expense this week?",
  "Am I over budget anywhere?",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! Ask me anything about your spending or budgets in last 30 days.",
  },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`mb-3 max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
      style={{ flexShrink: 1 }}
    >
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          isUser ? "bg-brand-bg" : "bg-white border border-[#E8E6DF]"
        }`}
      >
        <Text
          className={`text-sm ${isUser ? "text-white" : "text-brand-bg"}`}
          style={{ flexShrink: 1 }}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const { user } = useUser();
  const currency = useUserStore((s) => s.currency);
  const { refetch: refetchTransactions } = useTransactionsQuery();
  const { refetch: refetchBudget } = useBudgetQuery();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef("");
  const textInputRef = useRef<TextInput>(null);
  const inputFocusedRef = useRef(false);
  const pendingSendRef = useRef(false);
  const pendingSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || sending || !user) return;
    pendingSendRef.current = false;
    if (pendingSendTimerRef.current) {
      clearTimeout(pendingSendTimerRef.current);
      pendingSendTimerRef.current = null;
    }
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    inputRef.current = "";
    setInput("");
    setSending(true);

    try {
      const [{ data: transactions = [] }, { data: budget = null }] =
        await Promise.all([refetchTransactions(), refetchBudget()]);
      const reply = await askAssistant(question, transactions, budget, currency);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error("Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong answering that. Try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (sending || pendingSendRef.current) return;
    if (!inputFocusedRef.current) {
      void sendMessage(inputRef.current);
      return;
    }

    pendingSendRef.current = true;
    textInputRef.current?.blur();
    Keyboard.dismiss();
    pendingSendTimerRef.current = setTimeout(() => {
      pendingSendRef.current = false;
      pendingSendTimerRef.current = null;
      void sendMessage(inputRef.current);
    }, 250);
  };

  const handleInputEndEditing = (text: string) => {
    inputRef.current = text;
    setInput(text);
    inputFocusedRef.current = false;
    if (!pendingSendRef.current) return;

    pendingSendRef.current = false;
    if (pendingSendTimerRef.current) {
      clearTimeout(pendingSendTimerRef.current);
      pendingSendTimerRef.current = null;
    }
    void sendMessage(text);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <Text className="text-brand-bg text-xl font-semibold">Assistant</Text>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        className="flex-1"
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
          ListFooterComponent={
            sending ? (
              <View className="self-start mb-3 bg-white border border-[#E8E6DF] rounded-2xl px-3.5 py-2.5">
                <ActivityIndicator size="small" color="#4A9EFF" />
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View className="px-5 pb-2 gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                onPress={() => sendMessage(prompt)}
                className="max-w-[90%] bg-white rounded-xl border border-[#E8E6DF] px-3.5 py-2.5 self-start"
              >
                <Text className="text-brand-text-secondary text-xs">
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="flex-row items-end gap-2 px-5 pt-2 pb-3">
          <TextInput
            ref={textInputRef}
            value={input}
            onChangeText={(value) => {
              inputRef.current = value;
              setInput(value);
            }}
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onEndEditing={({ nativeEvent }) =>
              handleInputEndEditing(nativeEvent.text)
            }
            placeholder="Ask about your money..."
            placeholderTextColor="#8A8D96"
            editable={!sending}
            multiline
            submitBehavior="newline"
            textAlignVertical="center"
            className="max-h-28 min-w-0 flex-1 bg-white border border-[#E8E6DF] rounded-2xl px-4 py-3 text-sm text-brand-bg"
            returnKeyType="default"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending}
            className="w-11 h-11 rounded-full bg-brand-bg items-center justify-center"
            style={{ opacity: sending ? 0.6 : 1 }}
          >
            <Feather name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
