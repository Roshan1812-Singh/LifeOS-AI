import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Button, Card, EmptyState, KeyboardAware } from "../components/ui";
import { reminderService, type ReminderPayload } from "../services/reminders";
import { extractErrorMessage } from "../services/api";
import { cancelReminderNotification, scheduleReminderNotification } from "../native/notifications";
import type { Reminder } from "../types";
import { colors, radius, spacing } from "../theme";

type Offset = { label: string; ms: number };
const OFFSETS: Offset[] = [
  { label: "In 1 min", ms: 60_000 },
  { label: "In 1 hour", ms: 3_600_000 },
  { label: "Tomorrow", ms: 86_400_000 },
];

export function RemindersScreen() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [offset, setOffset] = useState<Offset>(OFFSETS[1]);
  const [attachLocation, setAttachLocation] = useState(false);

  const reminders = useQuery({
    queryKey: ["reminders"],
    queryFn: () => reminderService.list("ACTIVE"),
  });

  const create = useMutation({
    mutationFn: async (): Promise<{ remindAt: Date; title: string }> => {
      const remindAt = new Date(Date.now() + offset.ms);
      const payload: ReminderPayload = { title: title.trim(), remindAt: remindAt.toISOString() };

      if (attachLocation) {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = await Location.getCurrentPositionAsync({});
          payload.locationLat = pos.coords.latitude;
          payload.locationLng = pos.coords.longitude;
          payload.locationLabel = "Current location";
        }
      }

      await reminderService.create(payload);
      return { remindAt, title: payload.title };
    },
    onSuccess: async ({ remindAt, title: t }) => {
      await scheduleReminderNotification("Reminder", t, remindAt);
      setTitle("");
      setAttachLocation(false);
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
    onError: (e) => Alert.alert("Could not create reminder", extractErrorMessage(e)),
  });

  // Removing a reminder must also cancel its pending device notification, so a
  // deleted reminder never fires.
  const remove = useMutation({
    mutationFn: async (item: Reminder) => {
      await reminderService.remove(item.id);
      await cancelReminderNotification(item.title, new Date(item.remindAt));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
    onError: (e) => Alert.alert("Could not remove reminder", extractErrorMessage(e)),
  });

  return (
    <KeyboardAware>
      <FlatList
        style={styles.flex}
        data={reminders.data ?? []}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      ListHeaderComponent={
        <Card style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <Text style={styles.cardTitle}>New reminder</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What should I remind you about?"
            placeholderTextColor={colors.muted}
          />
          <View style={styles.offsets}>
            {OFFSETS.map((o) => (
              <Pressable
                key={o.label}
                style={[styles.offset, offset.label === o.label && styles.offsetActive]}
                onPress={() => setOffset(o)}
              >
                <Text style={[styles.offsetText, offset.label === o.label && styles.offsetTextActive]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.locationRow}>
            <View style={styles.locationLabel}>
              <Ionicons name="location-outline" size={18} color={colors.muted} />
              <Text style={styles.muted}>Attach current location</Text>
            </View>
            <Switch value={attachLocation} onValueChange={setAttachLocation} />
          </View>
          <Button
            title="Create reminder"
            onPress={() => create.mutate()}
            loading={create.isPending}
            disabled={!title.trim()}
          />
        </Card>
      }
      ListEmptyComponent={
        reminders.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <EmptyState title="No active reminders." />
        )
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.muted}>
              {new Date(item.remindAt).toLocaleString()}
              {item.locationLabel ? `  ·  ${item.locationLabel}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => remove.mutate(item)}
            hitSlop={8}
            disabled={remove.isPending}
            accessibilityLabel="Remove reminder"
          >
            <Ionicons name="close-circle" size={24} color={colors.danger} />
          </Pressable>
        </View>
      )}
      />
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.card,
  },
  offsets: { flexDirection: "row", gap: spacing.sm },
  offset: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  offsetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  offsetText: { color: colors.text, fontSize: 13 },
  offsetTextActive: { color: colors.primaryText, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  locationLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  muted: { color: colors.muted, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontWeight: "600", fontSize: 15 },
});
