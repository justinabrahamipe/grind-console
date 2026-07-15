import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiRequestError } from "../../api/client";
import { CycleDetail } from "../../api/types";
import { useAppTheme } from "../../hooks/useAppTheme";
import { CyclesStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<CyclesStackParamList, "CycleDetail">;

export default function CycleDetailScreen({ route, navigation }: Props) {
  const theme = useAppTheme();
  const { cycleId } = route.params;
  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CycleDetail>(`/api/cycles/${cycleId}`);
      setCycle(res);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load cycle.");
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = () => {
    Alert.alert("Delete cycle", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/api/cycles/${cycleId}`);
            navigation.goBack();
          } catch (err) {
            setError(err instanceof ApiRequestError ? err.message : "Couldn't delete cycle.");
          }
        },
      },
    ]);
  };

  const goToGoal = (goalId: number) => {
    // Cross-stack navigation (Cycles tab -> Goals tab); React Navigation's parent
    // navigator isn't statically typed with sibling tab param lists.
    (navigation.getParent() as { navigate: (name: string, params: unknown) => void } | undefined)
      ?.navigate("Goals", { screen: "GoalDetail", params: { goalId } });
  };

  if (loading || !cycle) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]} edges={["top"]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: theme.text }]}>{cycle.name}</Text>
          {cycle.isActive && <Text style={[styles.activeBadge, { color: theme.success }]}>Active</Text>}
        </View>
        <Text style={[styles.meta, { color: theme.subtext }]}>{cycle.startDate} → {cycle.endDate}</Text>

        {cycle.theme && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Theme</Text>
            <Text style={{ color: theme.text }}>{cycle.theme}</Text>
          </View>
        )}

        {cycle.vision && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Vision</Text>
            <Text style={{ color: theme.text }}>{cycle.vision}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, { borderColor: theme.border }]} onPress={() => navigation.navigate("CycleForm", { cycleId })}>
            <Text style={[styles.actionText, { color: theme.text }]}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { borderColor: theme.danger }]} onPress={handleDelete}>
            <Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text>
          </Pressable>
        </View>

        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Goals ({cycle.goals.length})</Text>
          {cycle.goals.length === 0 && <Text style={{ color: theme.subtext, fontSize: 13 }}>No goals linked. Assign a cycle from the goal's edit screen.</Text>}
          {cycle.goals.map((goal) => (
            <Pressable key={goal.id} style={[styles.goalRow, { borderColor: theme.border }]} onPress={() => goToGoal(goal.id)}>
              <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>{goal.name}</Text>
              <Text style={[styles.goalMeta, { color: theme.subtext }]}>{goal.goalType} · {goal.status}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 24, fontWeight: "700" },
  activeBadge: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  meta: { fontSize: 13, marginTop: 4 },
  card: { marginTop: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 16 },
  actionBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { fontSize: 13, fontWeight: "600" },
  error: { marginTop: 12, fontSize: 13 },
  goalRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  goalName: { fontSize: 14, fontWeight: "500" },
  goalMeta: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
});
