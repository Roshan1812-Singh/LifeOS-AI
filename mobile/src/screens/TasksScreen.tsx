import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Badge, EmptyState, KeyboardAware } from "../components/ui";
import { extractErrorMessage } from "../services/api";
import { taskService } from "../services/tasks";
import { colors, radius, spacing } from "../theme";
import type { Priority, Task } from "../types";

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "#64748b",
  MEDIUM: "#0ea5e9",
  HIGH: "#d97706",
  URGENT: "#dc2626",
};

export function TasksScreen() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => taskService.list() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  const create = useMutation({
    mutationFn: (t: string) => taskService.create({ title: t }),
    onSuccess: invalidate,
    onError: (e) => Alert.alert("Could not add task", extractErrorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (task: Task) =>
      taskService.updateStatus(task.id, task.status === "COMPLETED" ? "PENDING" : "COMPLETED"),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => taskService.remove(id),
    onSuccess: invalidate,
  });

  const add = () => {
    const t = title.trim();
    if (!t) return;
    setTitle("");
    create.mutate(t);
  };

  return (
    <KeyboardAware style={styles.flex}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Add a task..."
          placeholderTextColor={colors.muted}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={add} disabled={create.isPending || !title.trim()}>
          {create.isPending ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Ionicons name="add" size={24} color={colors.primaryText} />
          )}
        </Pressable>
      </View>

      {tasks.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={tasks.data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No tasks yet. Add your first one above." />}
          renderItem={({ item }) => {
            const done = item.status === "COMPLETED";
            return (
              <View style={styles.row}>
                <Pressable onPress={() => toggle.mutate(item)} hitSlop={8}>
                  <Ionicons
                    name={done ? "checkmark-circle" : "ellipse-outline"}
                    size={26}
                    color={done ? colors.success : colors.muted}
                  />
                </Pressable>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.title, done && styles.done]}>{item.title}</Text>
                  <Badge
                    text={item.priority}
                    color={PRIORITY_COLORS[item.priority]}
                    bg={`${PRIORITY_COLORS[item.priority]}22`}
                  />
                </View>
                <Pressable onPress={() => remove.mutate(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.muted} />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  addRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.lg },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.card,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  title: { fontSize: 15, color: colors.text, fontWeight: "500" },
  done: { textDecorationLine: "line-through", color: colors.muted },
});
