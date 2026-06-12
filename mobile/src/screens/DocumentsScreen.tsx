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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Badge, Button, Card, EmptyState } from "../components/ui";
import { documentService, type UploadFile } from "../services/documents";
import { extractErrorMessage } from "../services/api";
import { colors, radius, spacing } from "../theme";
import type { AskResponse } from "../types";

function fileNameFromUri(uri: string, fallback: string) {
  const last = uri.split("/").pop();
  return last && last.includes(".") ? last : fallback;
}

export function DocumentsScreen() {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);

  const docs = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });

  const upload = useMutation({
    mutationFn: (file: UploadFile) => documentService.upload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (e) => Alert.alert("Upload failed", extractErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const ask = useMutation({
    mutationFn: (q: string) => documentService.ask(q),
    onSuccess: setAnswer,
    onError: (e) => Alert.alert("Could not answer", extractErrorMessage(e)),
  });

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission needed", "Enable camera access to scan documents.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    upload.mutate({
      uri: asset.uri,
      name: asset.fileName ?? fileNameFromUri(asset.uri, `scan-${Date.now()}.jpg`),
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    upload.mutate({
      uri: asset.uri,
      name: asset.name ?? fileNameFromUri(asset.uri, `file-${Date.now()}`),
      mimeType: asset.mimeType,
    });
  };

  const submitAsk = () => {
    const q = question.trim();
    if (!q) return;
    setAnswer(null);
    ask.mutate(q);
  };

  return (
    <FlatList
      style={styles.flex}
      data={docs.data ?? []}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg }}>
          <View style={styles.actions}>
            <Button title="Scan (camera)" onPress={takePhoto} loading={upload.isPending} />
            <Button title="Pick file" variant="secondary" onPress={pickFile} />
          </View>

          <Card style={{ gap: spacing.md }}>
            <Text style={styles.cardTitle}>Ask your documents</Text>
            <TextInput
              style={styles.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="When does my insurance expire?"
              placeholderTextColor={colors.muted}
            />
            <Button title="Ask" onPress={submitAsk} loading={ask.isPending} disabled={!question.trim()} />
            {answer ? (
              <View style={styles.answer}>
                <Text style={styles.answerText}>{answer.answer}</Text>
                {answer.sources.length > 0 ? (
                  <View style={styles.sources}>
                    {answer.sources.map((s) => (
                      <Badge key={s.id} text={s.title} />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>

          <Text style={styles.cardTitle}>Your documents</Text>
        </View>
      }
      ListEmptyComponent={
        docs.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <EmptyState title="No documents yet. Scan or upload your first file." />
        )
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Badge text={label(item.category)} />
              {item.status !== "READY" ? (
                <Text style={styles.warn}>{item.status.toLowerCase()}</Text>
              ) : null}
            </View>
          </View>
          <Pressable onPress={() => remove.mutate(item.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.muted} />
          </Pressable>
        </View>
      )}
    />
  );
}

function label(v: string) {
  return v
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.md },
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
  answer: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  answerText: { color: colors.text, lineHeight: 20 },
  sources: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  docTitle: { color: colors.text, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  warn: { color: colors.warning, fontSize: 12 },
});
