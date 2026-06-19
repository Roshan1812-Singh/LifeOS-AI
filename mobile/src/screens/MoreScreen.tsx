import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "../components/ui";
import { LANGUAGES, useI18nStore, useT, type TranslationKey } from "../i18n";
import { colors, radius, spacing } from "../theme";
import { APP_NAME } from "../config";
import type { RootStackParamList, TabParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "More">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MoreScreen({ navigation }: Props) {
  const t = useT();
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  const items: { key: TranslationKey; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { key: "nav.documents", icon: "document-text-outline", onPress: () => navigation.navigate("Documents") },
    { key: "nav.reminders", icon: "notifications-outline", onPress: () => navigation.navigate("Reminders") },
  ];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>L</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>{t("more.appInfo")}</Text>
        </View>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.item, i < items.length - 1 && styles.itemBorder]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={22} color={colors.primary} />
            <Text style={styles.itemText}>{t(item.key)}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </Card>

      <View>
        <Text style={styles.sectionLabel}>{t("more.language")}</Text>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {LANGUAGES.map((lang, i) => {
            const selected = lang.code === language;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.item, i < LANGUAGES.length - 1 && styles.itemBorder]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={[styles.itemText, selected && styles.itemTextSelected]}>{lang.label}</Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <View style={styles.radio} />
                )}
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>
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
  subtitle: { color: colors.muted, marginTop: 2 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: "500" },
  itemTextSelected: { color: colors.primary, fontWeight: "700" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
});
