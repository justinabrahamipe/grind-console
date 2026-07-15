import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../hooks/useAppTheme";
import { MoreStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "MoreMenu">;

const ITEMS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; target: string }[] = [
  { key: "goals", label: "Goals", icon: "flag-outline", target: "GoalsStack" },
  { key: "cycles", label: "Cycles", icon: "sync-outline", target: "CyclesStack" },
  { key: "settings", label: "Settings", icon: "settings-outline", target: "Settings" },
];

export default function MoreScreen({ navigation }: Props) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>More</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {ITEMS.map((item, i) => (
          <Pressable
            key={item.key}
            style={[styles.row, i < ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}
            onPress={() => navigation.navigate(item.target as never)}
          >
            <Ionicons name={item.icon} size={20} color={theme.text} style={styles.icon} />
            <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: "700" },
  card: { margin: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  icon: { width: 22 },
  label: { flex: 1, fontSize: 15, fontWeight: "500" },
});
