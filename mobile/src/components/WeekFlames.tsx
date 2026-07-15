import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";
import { addDays, todayString } from "../utils/date";

type Entry = { date: string; actionScore: number };

function lastSevenDays(entries: Entry[]): Entry[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const today = todayString();
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return byDate.get(date) ?? { date, actionScore: 0 };
  });
}

const FLAME_SIZE = 22;

function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);
}

function Flame({ pct, theme }: { pct: number; theme: Theme }) {
  const fillHeight = pct > 0 ? Math.max(3, Math.round(pct * FLAME_SIZE)) : 0;
  return (
    <View style={styles.flameBox}>
      <Ionicons name="flame-outline" size={FLAME_SIZE} color={theme.border} style={StyleSheet.absoluteFill} />
      <View style={[styles.flameClip, { height: fillHeight }]}>
        <Ionicons name="flame" size={FLAME_SIZE} color={theme.warning} style={styles.flameIcon} />
      </View>
    </View>
  );
}

export default function WeekFlames({ theme, entries }: { theme: Theme; entries: Entry[] }) {
  const week = lastSevenDays(entries);
  const maxScore = Math.max(1, ...week.map((e) => e.actionScore));

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.subtext }]}>Last 7 days</Text>
      <View style={styles.row}>
        {week.map((e) => (
          <View key={e.date} style={styles.col}>
            <Flame pct={e.actionScore / maxScore} theme={theme} />
            <Text style={[styles.label, { color: theme.subtext }]}>{dayLabel(e.date)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 16 },
  title: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  col: { alignItems: "center", gap: 6 },
  flameBox: { width: FLAME_SIZE, height: FLAME_SIZE },
  flameClip: { position: "absolute", bottom: 0, left: 0, right: 0, overflow: "hidden" },
  flameIcon: { position: "absolute", bottom: 0 },
  label: { fontSize: 11, fontWeight: "600" },
});
