import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

const useNativeTabs = Platform.OS === "ios";

export default function TabLayout() {
  if (useNativeTabs) {
    return (
      <NativeTabs
        backgroundColor="#0B0E14"
        tintColor="#4A9EFF"
        iconColor={{ default: "#5C5F68", selected: "#4A9EFF" }}
        labelStyle={{
          default: { color: "#5C5F68" },
          selected: { color: "#4A9EFF" },
        }}
      >
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="transactions">
          <Icon sf="list.bullet" />
          <Label>Transactions</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="add-transaction">
          <Icon sf="plus.circle.fill" />
          <Label>Add</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="assistant">
          <Icon sf="brain.head.profile" />
          <Label>Assistant</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Android / Expo Go fallback — standard JS-based tab bar
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4A9EFF",
        tabBarInactiveTintColor: "#5C5F68",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E8E6DF",
          paddingTop: 4,
          height: 70,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
