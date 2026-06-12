import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Card, Field } from "../components/ui";
import { authService } from "../services/auth";
import { extractErrorMessage } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing } from "../theme";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen(_props: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: () =>
      authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      }),
    onSuccess: (auth) => setSession(auth),
    onError: (e) => setError(extractErrorMessage(e, "Registration failed")),
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: spacing.lg }}>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+1 555 0100"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title="Create account"
            onPress={() => register.mutate()}
            loading={register.isPending}
            disabled={!name || !email || password.length < 8}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, justifyContent: "center", flexGrow: 1 },
  error: { color: colors.danger, fontSize: 13 },
});
