import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";

import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { ExpensesScreen } from "../screens/ExpensesScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { RemindersScreen } from "../screens/RemindersScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
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

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
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
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTitleStyle: { color: colors.text } }}>
        {accessToken ? (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: "Documents" }} />
            <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: "Reminders" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create account" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
