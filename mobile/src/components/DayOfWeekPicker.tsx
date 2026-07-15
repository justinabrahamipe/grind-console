import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  theme: Theme;
  value: number[];
  onChange: (days: number[]) => void;
};

export default function DayOfWeekPicker({ theme, value, onChange }: Props) {
  const toggle = (day: number) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {DAYS.map((label, day) => {
          const active = value.includes(day);
          return (
            <Pressable
              key={day}
              style={[styles.day, { borderColor: theme.border, backgroundColor: active ? theme.accent : "transparent" }]}
              onPress={() => toggle(day)}
            >
              <Text style={{ color: active ? "#fff" : theme.text, fontWeight: "600", fontSize: 13 }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.presets}>
        <Pressable onPress={() => onChange([0, 1, 2, 3, 4, 5, 6])}>
          <Text style={[styles.presetLabel, { color: theme.accent }]}>Daily</Text>
        </Pressable>
        <Pressable onPress={() => onChange([1, 2, 3, 4, 5])}>
          <Text style={[styles.presetLabel, { color: theme.accent }]}>Weekdays</Text>
        </Pressable>
        <Pressable onPress={() => onChange([0, 6])}>
          <Text style={[styles.presetLabel, { color: theme.accent }]}>Weekends</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: { flexDirection: "row", gap: 6 },
  day: { width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  presets: { flexDirection: "row", gap: 16, marginTop: 10 },
  presetLabel: { fontSize: 12, fontWeight: "600" },
});
