import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";

export type SelectOption = { value: number | null; label: string };

type Props = {
  theme: Theme;
  label: string;
  placeholder?: string;
  value: number | null;
  options: SelectOption[];
  onChange: (value: number | null) => void;
};

export default function SelectField({ theme, label, placeholder = "None", value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
      <Pressable
        style={[styles.field, { borderColor: theme.border, backgroundColor: theme.card }]}
        onPress={() => setOpen(true)}
      >
        <Text style={{ color: selected ? theme.text : theme.subtext }}>{selected ? selected.label : placeholder}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{label}</Text>
            <FlatList
              data={[{ value: null, label: placeholder }, ...options]}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, { borderColor: theme.border }]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: item.value === value ? theme.accent : theme.text, fontWeight: item.value === value ? "700" : "400" }}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  field: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { maxHeight: "60%", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  option: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
