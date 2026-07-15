import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiRequestError } from "../api/client";
import { LocationLog } from "../api/types";
import { useAppTheme } from "../hooks/useAppTheme";
import { todayString } from "../utils/date";

export default function LogScreen() {
  const theme = useAppTheme();
  const [notes, setNotes] = useState("");
  const [attachLocation, setAttachLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LocationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get<LocationLog[]>("/api/locations?sort=desc");
      setLogs(res.slice(0, 30));
    } catch {
      // non-fatal: leave the list empty rather than blocking note entry
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSubmit = async () => {
    if (!notes.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      let coords: { latitude: number; longitude: number } | null = null;
      if (attachLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const position = await Location.getCurrentPositionAsync({});
          coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        }
      }
      await api.post("/api/locations", {
        notes: notes.trim(),
        date: todayString(),
        ...coords,
      });
      setNotes("");
      await loadLogs();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Log</Text>
        </View>

        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          data={logs}
          keyExtractor={(item) => String(item.id)}
          refreshing={loadingLogs}
          onRefresh={loadLogs}
          renderItem={({ item }) => (
            <View style={[styles.logRow, { borderColor: theme.border }]}>
              <Text style={[styles.logDate, { color: theme.subtext }]}>
                {item.date}{item.time ? ` · ${item.time}` : ""}
              </Text>
              <Text style={[styles.logNotes, { color: theme.text }]}>{item.notes}</Text>
            </View>
          )}
          ListEmptyComponent={
            !loadingLogs ? <Text style={[styles.empty, { color: theme.subtext }]}>No notes yet.</Text> : null
          }
        />

        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

        <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.subtext}
            multiline
          />
          <View style={styles.composerFooter}>
            <View style={styles.locationToggle}>
              <Switch value={attachLocation} onValueChange={setAttachLocation} />
              <Text style={[styles.locationLabel, { color: theme.subtext }]}>Attach location</Text>
            </View>
            <Pressable
              style={[styles.saveButton, { backgroundColor: theme.accent, opacity: submitting || !notes.trim() ? 0.5 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting || !notes.trim()}
            >
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: "700" },
  composer: { margin: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  input: { minHeight: 70, fontSize: 15, textAlignVertical: "top" },
  composerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  locationToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationLabel: { fontSize: 13 },
  saveButton: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  error: { marginHorizontal: 16, marginBottom: 8, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  logRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  logDate: { fontSize: 12, marginBottom: 2 },
  logNotes: { fontSize: 14 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
