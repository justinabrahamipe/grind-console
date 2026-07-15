import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  theme: Theme;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export default function SegmentedControl<T extends string>({ theme, options, value, onChange, disabled }: Props<T>) {
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.segment, active && { backgroundColor: theme.accent }]}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
          >
            <Text style={[styles.label, { color: active ? "#fff" : theme.text }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, overflow: "hidden" },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600" },
});
