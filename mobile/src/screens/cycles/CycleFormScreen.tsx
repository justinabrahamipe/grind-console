import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiRequestError } from "../../api/client";
import { Cycle } from "../../api/types";
import DateField from "../../components/DateField";
import { FormInput } from "../../components/FormField";
import FormSection from "../../components/FormSection";
import { useAppTheme } from "../../hooks/useAppTheme";
import { CyclesStackParamList } from "../../navigation/types";
import { addMonths, todayString } from "../../utils/date";

type Props = NativeStackScreenProps<CyclesStackParamList, "CycleForm">;

export default function CycleFormScreen({ route, navigation }: Props) {
  const theme = useAppTheme();
  const editingId = route.params?.cycleId;
  const isEditing = editingId != null;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<string | null>(todayString());
  const [endDate, setEndDate] = useState<string | null>(addMonths(todayString(), 1));
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [vision, setVision] = useState("");
  const [theme_, setTheme_] = useState("");

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        const cycles = await api.get<Cycle[]>("/api/cycles");
        const cycle = cycles.find((c) => c.id === editingId);
        if (cycle) {
          setName(cycle.name);
          setStartDate(cycle.startDate);
          setEndDate(cycle.endDate);
          setEndDateTouched(true);
          setVision(cycle.vision ?? "");
          setTheme_(cycle.theme ?? "");
        }
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Couldn't load cycle.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEditing, editingId]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (!endDateTouched) setEndDate(addMonths(value, 1));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !startDate) {
      setError("Name and start date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      name: name.trim(),
      startDate,
      endDate: endDate || undefined,
      vision: vision.trim() || null,
      theme: theme_.trim() || null,
    };
    try {
      if (isEditing) {
        await api.put(`/api/cycles/${editingId}`, body);
      } else {
        await api.post("/api/cycles", body);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save cycle.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]} edges={["top"]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{isEditing ? "Edit Cycle" : "New Cycle"}</Text>

          <FormSection theme={theme} title="Details">
            <FormInput theme={theme} label="Name" value={name} onChangeText={setName} placeholder="Cycle name" />
            <DateField theme={theme} label="Start date" value={startDate} onChange={handleStartDateChange} />
            <DateField theme={theme} label="End date" value={endDate} onChange={(v) => { setEndDate(v); setEndDateTouched(true); }} />
          </FormSection>

          <FormSection theme={theme} title="Notes">
            <FormInput theme={theme} label="Vision" value={vision} onChangeText={setVision} placeholder="What does success look like?" multiline style={styles.multiline} />
            <FormInput theme={theme} label="Theme" value={theme_} onChangeText={setTheme_} placeholder="A word or phrase for this cycle" />
          </FormSection>

          {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

          <Pressable style={[styles.saveButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEditing ? "Save changes" : "Create cycle"}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  error: { marginTop: 16, fontSize: 13 },
  saveButton: { marginTop: 28, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
