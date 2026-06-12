import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Card } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/auth";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList, TabParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "More">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MoreScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const items: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { label: "Documents", icon: "document-text-outline", onPress: () => navigation.navigate("Documents") },
    { label: "Reminders", icon: "notifications-outline", onPress: () => navigation.navigate("Reminders") },
  ];

  const logout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // ignore network errors on logout
    } finally {
      await useAuthStore.getState().clear();
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? "U").charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.name ?? "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.item, i < items.length - 1 && styles.itemBorder]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={22} color={colors.primary} />
            <Text style={styles.itemText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </Card>

      <Button title="Log out" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: 22, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "700", color: colors.text },
  email: { color: colors.muted },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: "500" },
});
