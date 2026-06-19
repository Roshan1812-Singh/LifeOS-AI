import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useT, type TranslationKey } from "../i18n";

import { HomeScreen } from "../screens/HomeScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { ExpensesScreen } from "../screens/ExpensesScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { RemindersScreen } from "../screens/RemindersScreen";
import { BootstrapScreen } from "../screens/BootstrapScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Documents: undefined;
  Reminders: undefined;
};

export type TabParamList = {
  Home: undefined;
  Assistant: undefined;
  Tasks: undefined;
  Expenses: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Assistant: "sparkles-outline",
  Tasks: "checkbox-outline",
  Expenses: "wallet-outline",
  More: "ellipsis-horizontal",
};

const TAB_LABELS: Record<keyof TabParamList, TranslationKey> = {
  Home: "nav.home",
  Assistant: "nav.assistant",
  Tasks: "nav.tasks",
  Expenses: "nav.expenses",
  More: "nav.more",
};

function Tabs() {
  const t = useT();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        title: t(TAB_LABELS[route.name]),
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const t = useT();
  const accessToken = useAuthStore((s) => s.accessToken);

  // No login UI: until a per-device session exists, show the bootstrap screen
  // (loading / retry). Once a token is present, the main app is shown.
  if (!accessToken) {
    return <BootstrapScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: t("nav.documents") }}
        />
        <Stack.Screen
          name="Reminders"
          component={RemindersScreen}
          options={{ title: t("nav.reminders") }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
