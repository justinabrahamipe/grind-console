import React from "react";
import { StyleSheet, Switch, Text, TextInput, TextInputProps, View } from "react-native";
import { Theme } from "../theme";

type InputProps = TextInputProps & { theme: Theme; label: string };

export function FormInput({ theme, label, style, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }, style]}
        placeholderTextColor={theme.subtext}
        {...rest}
      />
    </View>
  );
}

type ToggleProps = {
  theme: Theme;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function FormToggle({ theme, label, value, onChange }: ToggleProps) {
  return (
    <View style={[styles.toggleRow, { borderColor: theme.border }]}>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500" }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
});
