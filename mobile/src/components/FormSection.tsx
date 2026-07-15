import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme";

type Props = {
  theme: Theme;
  title?: string;
  children: React.ReactNode;
};

export default function FormSection({ theme, title, children }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {title && <Text style={[styles.title, { color: theme.subtext }]}>{title}</Text>}
      <View style={styles.fields}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 14 },
  title: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  fields: { gap: 14 },
});
