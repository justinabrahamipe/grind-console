import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiRequestError } from "../../api/client";
import { Goal, GoalType } from "../../api/types";
import FAB from "../../components/FAB";
import SegmentedControl from "../../components/SegmentedControl";
import { useAppTheme } from "../../hooks/useAppTheme";
import { GoalsStackParamList } from "../../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const TYPE_OPTIONS: { value: GoalType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "habitual", label: "Habit" },
  { value: "target", label: "Target" },
  { value: "outcome", label: "Outcome" },
  { value: "project", label: "Project" },
];

function progressLabel(goal: Goal): string {
  if (goal.goalType === "project") return `${goal.currentValue} of ${goal.targetValue} steps`;
  if (goal.completionType === "checkbox") return goal.status === "completed" ? "Done" : "In progress";
  return `${goal.currentValue}${goal.targetValue ? ` / ${goal.targetValue}` : ""}${goal.unit ? ` ${goal.unit}` : ""}`;
}

export default function GoalsListScreen({ navigation }: { navigation: NativeStackNavigationProp<GoalsStackParamList, "GoalsList"> }) {
  const theme = useAppTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<GoalType | "all">("all");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get<Goal[]>("/api/goals");
      setGoals(res);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load goals.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = goals.filter((g) => {
    if (typeFilter !== "all" && g.goalType !== typeFilter) return false;
    if (search.trim() && !g.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const sections = [
    { key: "current", title: "Current", data: filtered.filter((g) => g.status === "active") },
    { key: "past", title: "Past", data: filtered.filter((g) => g.status !== "active") },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Goals</Text>
      </View>

      <TextInput
        style={[styles.search, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        value={search}
        onChangeText={setSearch}
        placeholder="Search goals"
        placeholderTextColor={theme.subtext}
      />

      <View style={styles.filterWrap}>
        <SegmentedControl theme={theme} options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={styles.loading} />
      ) : (
        <SectionList
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.accent} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.subtext }]}>No goals yet.</Text>}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.subtext, backgroundColor: theme.bg }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate("GoalDetail", { goalId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                {item.status !== "active" && (
                  <Text style={[styles.statusBadge, { color: item.status === "completed" ? theme.success : theme.danger }]}>
                    {item.status}
                  </Text>
                )}
              </View>
              <Text style={[styles.cardMeta, { color: theme.subtext }]}>
                {item.pillarEmoji ? `${item.pillarEmoji} ` : ""}{item.pillarName ?? "No pillar"} · {item.goalType}
              </Text>
              <Text style={[styles.cardProgress, { color: theme.accent }]}>{progressLabel(item)}</Text>
            </Pressable>
          )}
        />
      )}
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
      <FAB theme={theme} onPress={() => navigation.navigate("GoalForm", {})} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  search: { marginHorizontal: 16, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  filterWrap: { paddingHorizontal: 16, marginTop: 12 },
  loading: { marginTop: 40 },
  listContent: { padding: 16, paddingBottom: 100 },
  sectionHeader: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, paddingVertical: 8 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 16, fontWeight: "600", flex: 1 },
  statusBadge: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  cardMeta: { fontSize: 12, marginTop: 4 },
  cardProgress: { fontSize: 13, fontWeight: "600", marginTop: 6 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  error: { textAlign: "center", marginBottom: 12, fontSize: 13 },
});
