import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";
import { toDateString } from "../utils/date";

type Props = {
  theme: Theme;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function DateField({ theme, label, value, onChange, placeholder = "Not set" }: Props) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(`${value}T00:00:00`) : new Date();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
      <Pressable style={[styles.field, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setOpen(true)}>
        <Text style={{ color: value ? theme.text : theme.subtext }}>{value || placeholder}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant={theme.dark ? "dark" : "light"}
          accentColor={theme.accent}
          onChange={(_, selected) => {
            setOpen(Platform.OS === "ios");
            if (selected) onChange(toDateString(selected));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  field: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
});
