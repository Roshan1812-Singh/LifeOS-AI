import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { useT } from "../i18n";
import { colors, spacing } from "../theme";
import { APP_NAME } from "../config";

/**
 * Shown while the app silently establishes a per-device session. There is no
 * login UI; on success the navigator swaps to the main tabs automatically.
 */
export function BootstrapScreen() {
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // If we land here with a non-loading status (e.g. the session was cleared
  // after a failed token refresh), silently re-establish it.
  useEffect(() => {
    if (status !== "loading") bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>L</Text>
      </View>
      <Text style={styles.title}>{APP_NAME}</Text>

      {status === "error" ? (
        <>
          <Text style={styles.message}>{t("bootstrap.failed")}</Text>
          <Button title={t("bootstrap.retry")} onPress={() => bootstrap()} />
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.lg }} />
          <Text style={styles.message}>{t("bootstrap.settingUp")}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.primaryText, fontSize: 32, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  message: { color: colors.muted, textAlign: "center", maxWidth: 320, lineHeight: 20 },
});
