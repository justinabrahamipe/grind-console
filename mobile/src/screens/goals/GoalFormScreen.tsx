import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiRequestError } from "../../api/client";
import { CompletionType, Cycle, FlexibilityRule, Goal, GoalType, Pillar } from "../../api/types";
import DateField from "../../components/DateField";
import DayOfWeekPicker from "../../components/DayOfWeekPicker";
import { FormInput, FormToggle } from "../../components/FormField";
import FormSection from "../../components/FormSection";
import SegmentedControl from "../../components/SegmentedControl";
import SelectField from "../../components/SelectField";
import { useAppTheme } from "../../hooks/useAppTheme";
import { GoalsStackParamList } from "../../navigation/types";
import { todayString } from "../../utils/date";

type Props = NativeStackScreenProps<GoalsStackParamList, "GoalForm">;

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "habitual", label: "Habit" },
  { value: "target", label: "Target" },
  { value: "outcome", label: "Outcome" },
  { value: "project", label: "Project" },
];

const COMPLETION_TYPE_OPTIONS_HABITUAL: { value: CompletionType; label: string }[] = [
  { value: "checkbox", label: "Checkbox" },
  { value: "count", label: "Count" },
  { value: "numeric", label: "Numeric" },
  { value: "duration", label: "Timer" },
];

const COMPLETION_TYPE_OPTIONS_TARGET: { value: CompletionType; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "numeric", label: "Numeric" },
  { value: "duration", label: "Timer" },
];

const MODE_OPTIONS: { value: FlexibilityRule; label: string }[] = [
  { value: "must_today", label: "Target" },
  { value: "limit_avoid", label: "Limit" },
];

function countScheduledDaysInRange(start: string, end: string, days: number[]): number {
  if (days.length === 0) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (days.includes(current.getDay())) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function GoalFormScreen({ route, navigation }: Props) {
  const theme = useAppTheme();
  const editingId = route.params?.goalId;
  const isEditing = editingId != null;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);

  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("habitual");
  const [pillarId, setPillarId] = useState<number | null>(null);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [completionType, setCompletionType] = useState<CompletionType>("checkbox");
  const [flexibilityRule, setFlexibilityRule] = useState<FlexibilityRule>("must_today");
  const [dailyTarget, setDailyTarget] = useState("");
  const [startValue, setStartValue] = useState("0");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [startDate, setStartDate] = useState<string | null>(todayString());
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [basePoints, setBasePoints] = useState("10");
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pillarList, cycleList] = await Promise.all([
          api.get<Pillar[]>("/api/pillars"),
          api.get<Cycle[]>("/api/cycles"),
        ]);
        setPillars(pillarList);
        setCycles(cycleList);

        if (isEditing) {
          const goals = await api.get<Goal[]>("/api/goals");
          const goal = goals.find((g) => g.id === editingId);
          if (goal) {
            setName(goal.name);
            setGoalType(goal.goalType);
            setPillarId(goal.pillarId);
            setPeriodId(goal.periodId);
            setCompletionType(goal.completionType);
            setFlexibilityRule(goal.flexibilityRule === "limit_avoid" ? "limit_avoid" : "must_today");
            setDailyTarget(goal.dailyTarget != null ? String(goal.dailyTarget) : "");
            setStartValue(String(goal.startValue));
            setTargetValue(goal.targetValue != null ? String(goal.targetValue) : "");
            setUnit(goal.unit ?? "");
            setStartDate(goal.startDate);
            setTargetDate(goal.targetDate);
            setScheduleDays(goal.scheduleDays ?? [0, 1, 2, 3, 4, 5, 6]);
            setBasePoints(String(goal.basePoints));
            setAutoCreateTasks(goal.autoCreateTasks);
          }
        }
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Couldn't load form data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEditing, editingId]);

  const isHabitual = goalType === "habitual";
  const isTarget = goalType === "target";
  const isOutcomeOrTarget = goalType === "outcome" || isTarget;
  const isProject = goalType === "project";
  const showCompletionType = isHabitual || isTarget;
  const showSchedule = !isProject;
  const showPoints = isHabitual || isProject;
  const showAutoCreate = !isProject && !isEditing;
  const completionTypeOptions = isTarget ? COMPLETION_TYPE_OPTIONS_TARGET : COMPLETION_TYPE_OPTIONS_HABITUAL;

  const perSessionPreview = (() => {
    if (!isTarget || completionType === "checkbox" || !startDate || !targetDate || scheduleDays.length === 0) return null;
    const days = countScheduledDaysInRange(startDate, targetDate, scheduleDays);
    if (days <= 0) return null;
    const perSession = Math.ceil((Number(targetValue) || 0) / days);
    return perSession > 0 ? `≈ ${perSession}${unit ? ` ${unit}` : ""} per session (${days} sessions)` : null;
  })();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (isOutcomeOrTarget && !targetValue.trim()) {
      setError("Target value is required for this goal type.");
      return;
    }
    setSaving(true);
    setError(null);

    let computedDailyTarget: number | null = null;
    if (isHabitual) {
      computedDailyTarget = dailyTarget.trim() ? Number(dailyTarget) : null;
    } else if (isTarget && completionType !== "checkbox" && startDate && targetDate && scheduleDays.length > 0) {
      const days = countScheduledDaysInRange(startDate, targetDate, scheduleDays);
      computedDailyTarget = days > 0 ? Math.ceil((Number(targetValue) || 0) / days) : null;
    }

    const body = {
      name: name.trim(),
      goalType,
      pillarId,
      periodId,
      completionType: isProject ? "checkbox" : completionType,
      flexibilityRule: isProject ? "must_today" : flexibilityRule,
      limitValue: flexibilityRule === "limit_avoid" && computedDailyTarget != null ? computedDailyTarget : null,
      dailyTarget: isProject ? null : computedDailyTarget,
      startValue: Number(startValue || 0),
      targetValue: targetValue.trim() ? Number(targetValue) : undefined,
      unit: unit.trim() || (isProject ? "steps" : undefined),
      startDate,
      targetDate,
      scheduleDays: showSchedule ? scheduleDays : null,
      basePoints: Number(basePoints || 10),
      autoCreateTasks: isProject ? false : autoCreateTasks,
    };

    try {
      if (isEditing) {
        await api.put(`/api/goals/${editingId}`, body);
      } else {
        await api.post("/api/goals", body);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save goal.");
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
          <Text style={[styles.title, { color: theme.text }]}>{isEditing ? "Edit Goal" : "New Goal"}</Text>

          <FormSection theme={theme} title="Type">
            <SegmentedControl
              theme={theme}
              options={GOAL_TYPE_OPTIONS}
              value={goalType}
              onChange={(type) => {
                setGoalType(type);
                if (type === "target" && completionType === "checkbox") setCompletionType("count");
              }}
              disabled={isEditing}
            />
          </FormSection>

          <FormSection theme={theme} title="Details">
            <FormInput theme={theme} label="Name" value={name} onChangeText={setName} placeholder="Goal name" />

            {showCompletionType && (
              <SegmentedControl theme={theme} options={completionTypeOptions} value={completionType} onChange={setCompletionType} />
            )}

            {showCompletionType && completionType !== "checkbox" && (
              <>
                <SegmentedControl theme={theme} options={MODE_OPTIONS} value={flexibilityRule} onChange={setFlexibilityRule} />

                {isHabitual && (
                  <>
                    <FormInput
                      theme={theme}
                      label={flexibilityRule === "limit_avoid" ? "Per-session limit" : "Per-session target"}
                      value={dailyTarget}
                      onChangeText={setDailyTarget}
                      keyboardType="numeric"
                    />
                    <FormInput theme={theme} label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. reps, pages" editable={completionType !== "duration"} />
                  </>
                )}

                {isTarget && (
                  <Text style={[styles.hint, { color: theme.subtext }]}>
                    {perSessionPreview ?? "Set target, dates & schedule to see per-session breakdown"}
                  </Text>
                )}
              </>
            )}
          </FormSection>

          {isOutcomeOrTarget && (
            <FormSection theme={theme} title="Progress">
              <FormInput theme={theme} label="Start value" value={startValue} onChangeText={setStartValue} keyboardType="numeric" />
              <FormInput theme={theme} label="Target value" value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" />
              <FormInput theme={theme} label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. kg, pages" />
            </FormSection>
          )}

          <FormSection theme={theme} title="Organize">
            <SelectField
              theme={theme}
              label="Pillar"
              value={pillarId}
              options={pillars.map((p) => ({ value: p.id, label: `${p.emoji ?? ""} ${p.name}`.trim() }))}
              onChange={setPillarId}
            />

            <SelectField
              theme={theme}
              label="Cycle"
              value={periodId}
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(id) => {
                setPeriodId(id);
                const cycle = cycles.find((c) => c.id === id);
                if (cycle) {
                  setStartDate(cycle.startDate);
                  setTargetDate(cycle.endDate);
                }
              }}
            />
          </FormSection>

          <FormSection theme={theme} title="Timing">
            <DateField theme={theme} label="Start date" value={startDate} onChange={setStartDate} />
            <DateField theme={theme} label="Target date" value={targetDate} onChange={setTargetDate} />

            {showSchedule && (
              <View>
                <Text style={[styles.label, { color: theme.subtext }]}>Repeat on</Text>
                <DayOfWeekPicker theme={theme} value={scheduleDays} onChange={setScheduleDays} />
              </View>
            )}
          </FormSection>

          {(showPoints || showAutoCreate) && (
            <FormSection theme={theme} title="Rewards">
              {showPoints && (
                <FormInput theme={theme} label="Points" value={basePoints} onChangeText={setBasePoints} keyboardType="numeric" />
              )}
              {showAutoCreate && (
                <FormToggle theme={theme} label="Auto-create daily tasks" value={autoCreateTasks} onChange={setAutoCreateTasks} />
              )}
            </FormSection>
          )}

          {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

          <Pressable style={[styles.saveButton, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEditing ? "Save changes" : "Create goal"}</Text>}
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
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  hint: { fontSize: 12 },
  error: { marginTop: 16, fontSize: 13 },
  saveButton: { marginTop: 28, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
