import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { baseUrl, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert("Sign out", "You'll need your API key again to sign back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.subtext }]}>Server</Text>
        <Text style={[styles.value, { color: theme.text }]}>{baseUrl}</Text>
      </View>

      <Pressable style={[styles.button, { borderColor: theme.danger }]} onPress={confirmLogout}>
        <Text style={[styles.buttonText, { color: theme.danger }]}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: "700" },
  card: { margin: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  value: { fontSize: 15, marginTop: 4 },
  button: { marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonText: { fontSize: 15, fontWeight: "600" },
});
