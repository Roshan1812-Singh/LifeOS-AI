import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Card, Field } from "../components/ui";
import { authService } from "../services/auth";
import { extractErrorMessage } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing } from "../theme";
import { APP_NAME } from "../config";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: () => authService.login({ email: email.trim(), password }),
    onSuccess: (auth) => setSession(auth),
    onError: (e) => setError(extractErrorMessage(e, "Login failed")),
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Your personal AI operating system</Text>
        </View>

        <Card style={{ gap: spacing.lg }}>
          <Field
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
            secureTextEntry
            placeholder="Your password"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title="Sign in"
            onPress={() => login.mutate()}
            loading={login.isPending}
            disabled={!email || !password}
          />
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>
              Don&apos;t have an account? <Text style={styles.linkStrong}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, justifyContent: "center", flexGrow: 1, gap: spacing.xl },
  brand: { alignItems: "center", gap: spacing.sm },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.primaryText, fontSize: 28, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.muted },
  error: { color: colors.danger, fontSize: 13 },
  link: { textAlign: "center", color: colors.muted },
  linkStrong: { color: colors.primary, fontWeight: "700" },
});
